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
    const { id: _, ...data } = req.body;

    const originsRef = db.collection(`tenants/${tenantId}/delivery_origins`);

    if (id) {
      const doc = await originsRef.doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Origin not found" });

      const oldData = doc.data() as any;

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
    const { id: _, availabilityHistory, _testDist, ...data } = req.body;

    const couriersRef = db.collection(`tenants/${tenantId}/couriers`);

    if (id) {
      const doc = await couriersRef.doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Courier not found" });

      const oldData = doc.data() as any;
      const newVersion = (oldData.config?.version || 0) + 1;

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

export const deleteCourierHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const id = req.params.id;
  await db.collection(`tenants/${tenantId}/couriers`).doc(id).delete();
  res.json({ success: true });
};

export const getDeliveryQuoteHandler = async (req: Request, res: Response) => {
  try {
    const tenantId = DEFAULT_TENANT;
    const { destinationLat, destinationLng, paymentTiming } = req.body;

    if (!destinationLat || !destinationLng) {
      return res.status(400).json({ error: "Destination coordinates are required" });
    }

    const originsRef = db.collection(`tenants/${tenantId}/delivery_origins`);
    let originDoc = null;

    const defaultOriginQuery = await originsRef.where("isDefault", "==", true).limit(1).get();
    if (!defaultOriginQuery.empty) {
      originDoc = defaultOriginQuery.docs[0];
    } else {
      const allOrigins = await originsRef.limit(1).get();
      if (allOrigins.empty) return res.status(500).json({ error: "No delivery origins configured. Please add an origin in Admin -> Courier Management." });
      originDoc = allOrigins.docs[0];
    }

    const origin = originDoc.data() as any;
    const originId = originDoc.id;

    const couriersSnapshot = await db.collection(`tenants/${tenantId}/couriers`).where("status", "==", "available").get();
    const couriers = couriersSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (couriers.length === 0) {
      return res.json({ data: [] });
    }

    const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

    const quotes = await Promise.all(couriers.map(async (courier) => {
      let routeDistanceMeters = 5000;
      let durationSeconds = 900;

      if (GEOAPIFY_API_KEY) {
        try {
          const mode = courier.routingMode || 'motorcycle';
          const url = `https://api.geoapify.com/v1/routing?waypoints=${origin.lat},${origin.lng}|${destinationLat},${destinationLng}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`;
          const routeRes = await fetch(url);
          const routeData = await routeRes.json() as any;
          const feature = routeData.features?.[0];
          if (feature) {
            routeDistanceMeters = feature.properties.distance;
            durationSeconds = feature.properties.time;
          }
        } catch (e) {
          console.error("Routing error for courier", courier.id, e);
        }
      }

      const isNight = false;

      const feeResult = calculateDeliveryFee(routeDistanceMeters, courier.config, isNight);

      const quoteId = `quote_${Date.now()}_${courier.id}`;

      return {
        id: quoteId,
        courierId: courier.id,
        courierName: courier.name,
        logoUrl: courier.logoUrl,
        configVersion: courier.config?.version || 1,
        status: courier.status,
        origin: {
          id: originId,
          name: origin.name,
          lat: origin.lat,
          lng: origin.lng,
          version: origin.version || 1
        },
        route: {
          mode: courier.routingMode || 'motorcycle',
          distanceMeters: routeDistanceMeters,
          durationSeconds: durationSeconds
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
  } catch (err: any) {
    console.error("Delivery quote error:", err);
    res.status(500).json({ error: err.message });
  }
};
