import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import { calculateDeliveryFee } from "../../packages/domain/delivery-formula.js";

const DEFAULT_TENANT = "default";

export const getDeliveryOriginsHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const snapshot = await db.collection(`tenants/${tenantId}/delivery_origins`).get();
  const origins = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  res.json({ data: origins });
};

export const upsertDeliveryOriginHandler = async (req: Request, res: Response) => {
  try {
    const tenantId = DEFAULT_TENANT;
    const { id } = req.params;
    const { id: _, ...data } = req.body; // sanitize
    
    const originsRef = db.collection(`tenants/${tenantId}/delivery_origins`);
    
    if (id) {
      const doc = await originsRef.doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Origin not found" });
      
      const oldData = doc.data() as any;
      
      // revalidate lat/lng ranges
      if (data.lat !== undefined && (data.lat < -90 || data.lat > 90)) {
        return res.status(400).json({ error: "Invalid latitude" });
      }
      if (data.lng !== undefined && (data.lng < -180 || data.lng > 180)) {
        return res.status(400).json({ error: "Invalid longitude" });
      }

      const update = {
        ...data,
        version: (oldData.version || 0) + 1,
        updatedAt: new Date().toISOString()
      };
      await originsRef.doc(id).update(update);
      res.json({ success: true });
    } else {
      const newOrigin = {
        ...data,
        status: 'active',
        isDefault: false,
        version: 1,
        updatedAt: new Date().toISOString()
      };
      const ref = await originsRef.add(newOrigin);
      res.json({ id: ref.id });
    }
  } catch (err: any) {
    console.error("Origin upsert error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const setDefaultDeliveryOriginHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.body;
  
  const originsRef = db.collection(`tenants/${tenantId}/delivery_origins`);
  const snapshot = await originsRef.get();
  const batch = db.batch();
  
  let targetFound = false;
  snapshot.docs.forEach((d: any) => {
    if (d.id === id) {
      batch.update(d.ref, { isDefault: true, updatedAt: new Date().toISOString() });
      targetFound = true;
    } else if (d.data().isDefault) {
      batch.update(d.ref, { isDefault: false, updatedAt: new Date().toISOString() });
    }
  });
  
  if (!targetFound) return res.status(404).json({ error: "Origin not found" });
  
  await batch.commit();
  
  // Audit the switch
  await db.collection(`tenants/${tenantId}/audit_events`).add({
    type: 'default_origin_switch',
    newDefaultId: id,
    timestamp: new Date().toISOString(),
    operator: 'admin'
  });
  
  res.json({ success: true });
};

export const getCouriersHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const snapshot = await db.collection(`tenants/${tenantId}/couriers`).orderBy('sortOrder', 'asc').get();
  const couriers = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  res.json({ data: couriers });
};

export const upsertCourierHandler = async (req: Request, res: Response) => {
  try {
    const tenantId = DEFAULT_TENANT;
    const { id } = req.params;
    const { id: _, availabilityHistory, _testDist, ...data } = req.body; // sanitize
    
    const couriersRef = db.collection(`tenants/${tenantId}/couriers`);
    
    if (id) {
      const doc = await couriersRef.doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Courier not found" });
      
      const oldData = doc.data() as any;
      const newVersion = (oldData.config?.version || 0) + 1;
      
      // Merge config carefully
      const config = {
        ...(oldData.config || {}),
        ...(data.config || {}),
        version: newVersion
      };
      
      await couriersRef.doc(id).update({
        ...data,
        config,
        updatedAt: new Date().toISOString()
      });
    } else {
      await couriersRef.add({
        ...data,
        status: 'available',
        updatedAt: new Date().toISOString(),
        availabilityHistory: []
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Courier upsert error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleCourierAvailabilityHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const { status, reason, operator } = req.body;
  
  const ref = db.collection(`tenants/${tenantId}/couriers`).doc(id);
  const doc = await ref.get();
  const data = doc.data() as any;
  
  const historyEvent = {
    status,
    operator,
    reason,
    timestamp: new Date().toISOString()
  };
  
  await ref.update({
    status,
    availabilityHistory: [historyEvent, ...(data.availabilityHistory || [])].slice(0, 50),
    updatedAt: new Date().toISOString()
  });
  
  // Audit
  await db.collection(`tenants/${tenantId}/audit_events`).add({
    type: 'courier_availability_change',
    courierId: id,
    newStatus: status,
    reason,
    operator,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
};

export const getDeliveryQuoteHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { destinationLat, destinationLng, paymentTiming } = req.body;
  
  // 1. Get default origin
  const originsRef = db.collection(`tenants/${tenantId}/delivery_origins`);
  const originQuery = await originsRef.where("isDefault", "==", true).limit(1).get();
  if (originQuery.empty) return res.status(500).json({ error: "No default delivery origin configured" });
  
  const origin = originQuery.docs[0].data() as any;
  const originId = originQuery.docs[0].id;
  
  // 2. Get available couriers
  const couriersSnapshot = await db.collection(`tenants/${tenantId}/couriers`).where("status", "==", "available").get();
  const couriers = couriersSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  
  // 3. For each courier, get road distance via Geoapify (Mocked for now, will integrate Geoapify properly in geoapify.ts)
  // Authoritative distance must come from Geoapify Routing
  const quotes = await Promise.all(couriers.map(async (courier) => {
    // This should call Geoapify Routing API
    // const route = await getRoute(origin.lat, origin.lng, destinationLat, destinationLng, courier.routingMode);
    const routeDistanceMeters = 5000; // Mock 5km
    
    const isNight = false; // logic to check based on tenant timezone
    
    const feeResult = calculateDeliveryFee(routeDistanceMeters, courier.config, isNight);
    
    return {
      courierId: courier.id,
      courierName: courier.name,
      logoUrl: courier.logoUrl,
      configVersion: courier.config.version,
      origin: {
        id: originId,
        name: origin.name,
        lat: origin.lat,
        lng: origin.lng,
        version: origin.version
      },
      route: {
        mode: courier.routingMode,
        distanceMeters: routeDistanceMeters
      },
      components: {
        baseFareMinor: feeResult.baseFareMinor,
        excessChargeMinor: feeResult.excessChargeMinor,
        platformFeeMinor: feeResult.platformFeeMinor,
        distanceSurchargeMinor: feeResult.distanceSurchargeMinor,
        nightFeeMinor: feeResult.nightFeeMinor
      },
      totalMinor: feeResult.totalMinor,
      currency: "PHP",
      paymentTiming: paymentTiming || 'checkout',
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString()
    };
  }));
  
  res.json({ data: quotes });
};
