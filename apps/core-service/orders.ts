import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import crypto from "crypto";

export const getOrdersHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const snapshot = await db.collection(`tenants/${tenantId}/orders`).get();
  let docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  
  // Sort by date desc
  docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  res.json({ data: docs });
};

export const getOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const doc = await db.collection(`tenants/${tenantId}/orders`).doc(id).get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: "Order not found" });
  }
  
  res.json({ data: { id: doc.id, ...doc.data() } });
};

export const updateOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const updateData = req.body;
  
  await db.collection(`tenants/${tenantId}/orders`).doc(id).update(updateData);
  
  res.json({ success: true });
};

export const createOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = req.headers["x-customer-id"] || "preview-user-id";
  const { items, receiverName, receiverPhone, address, totals } = req.body;
  
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  
  const orderData = {
    id: orderId,
    customerId,
    customerName: receiverName,
    customerPhone: receiverPhone,
    address,
    items,
    total: totals?.total || 0,
    status: 'PENDING',
    date: new Date().toISOString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  
  await db.collection(`tenants/${tenantId}/orders`).doc(orderId).set(orderData);
  
  // Clear cart
  await db.collection(`tenants/${tenantId}/carts`).doc(customerId).set({ items: [] });
  
  res.json({ data: orderData });
};
