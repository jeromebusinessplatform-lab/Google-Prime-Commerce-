import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

export const getPromotionsHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const snapshot = await db.collection(`tenants/${tenantId}/promotions`).get();
  let docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  
  // Seed with default promos if empty
  if (docs.length === 0) {
    const dummyPromos = [
      { code: 'WELCOME10', type: 'percentage', value: 10, status: 'active', usageLimit: 100, used: 25 },
      { code: 'FREESHIP', type: 'fixed', value: 50, status: 'active', usageLimit: null, used: 142 },
    ];
    for (const p of dummyPromos) {
      const ref = await db.collection(`tenants/${tenantId}/promotions`).add(p);
      docs.push({ id: ref.id, ...p });
    }
  }
  res.json({ data: docs });
};

export const createPromotionHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const newPromo = {
    ...req.body,
    code: req.body.code.toUpperCase(),
    used: 0,
    status: 'active'
  };
  const ref = await db.collection(`tenants/${tenantId}/promotions`).add(newPromo);
  res.json({ data: { id: ref.id, ...newPromo } });
};

export const validatePromotionHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { code } = req.body;
  
  if (!code) return res.status(400).json({ error: "Code is required" });
  
  const snapshot = await db.collection(`tenants/${tenantId}/promotions`).where('code', '==', code.toUpperCase()).get();
  
  if (snapshot.empty) {
    return res.status(404).json({ error: "Invalid promo code" });
  }
  
  const promo = { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as any) };
  
  if (promo.status !== 'active') {
    return res.status(400).json({ error: "Promo code is expired or inactive" });
  }
  
  if (promo.usageLimit && promo.used >= promo.usageLimit) {
    return res.status(400).json({ error: "Promo code usage limit reached" });
  }
  
  res.json({ data: promo });
};

export const deletePromotionHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const id = req.params.id;
  await db.collection(`tenants/${tenantId}/promotions`).doc(id).delete();
  res.json({ success: true });
};
