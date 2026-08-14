import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

const DEFAULT_TENANT = "default";

export const getTenantHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const tenantRef = db.collection("tenants").doc(tenantId);
  const doc = await tenantRef.get();
  
  if (!doc.exists) {
    // Initial default settings if not exists
    const defaultSettings = {
      name: "PRIME Store",
      logoUrl: "/logo.svg",
      contactEmail: "support@prime.store",
      contactPhone: "+63 912 345 6789",
      address: "Manila, Philippines",
      timezone: "Asia/Manila",
      currency: "PHP",
      updatedAt: new Date().toISOString()
    };
    await tenantRef.set(defaultSettings);
    return res.json({ data: { id: tenantId, ...defaultSettings } });
  }
  
  res.json({ data: { id: doc.id, ...doc.data() } });
};

export const updateTenantHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const tenantRef = db.collection("tenants").doc(tenantId);
  
  const updateData = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  await tenantRef.update(updateData);
  const doc = await tenantRef.get();
  res.json({ data: { id: doc.id, ...doc.data() } });
};
