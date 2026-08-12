import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

export const getCartHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = req.headers["x-customer-id"] || "preview-user-id";
  const cartRef = db.collection(`tenants/${tenantId}/carts`).doc(customerId as string);
  const cartDoc = await cartRef.get();
  if (!cartDoc.exists) {
    return res.json({ data: { items: [] } });
  }
  res.json({ data: cartDoc.data() });
};

export const updateCartItemHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = req.headers["x-customer-id"] || "preview-user-id";
  const { product, quantity } = req.body; // { id, name, price, image }
  
  const cartRef = db.collection(`tenants/${tenantId}/carts`).doc(customerId as string);
  const cartDoc = await cartRef.get();
  let items = cartDoc.exists ? (cartDoc.data().items || []) : [];
  
  const existingIndex = items.findIndex((i: any) => i.id === product.id);
  if (quantity <= 0) {
    if (existingIndex > -1) items.splice(existingIndex, 1);
  } else {
    if (existingIndex > -1) {
      items[existingIndex].quantity = quantity;
    } else {
      items.push({ ...product, quantity });
    }
  }
  
  await cartRef.set({ items });
  res.json({ success: true, data: { items } });
};

export const clearCartHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = req.headers["x-customer-id"] || "preview-user-id";
  await db.collection(`tenants/${tenantId}/carts`).doc(customerId as string).set({ items: [] });
  res.json({ success: true, data: { items: [] } });
};
