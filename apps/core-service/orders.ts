import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import crypto from "crypto";
import { sendTelegramMessage } from "./telegram.js";

export const createOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerIdRaw = req.headers["x-customer-id"] || "preview-user-id";
  const customerId = Array.isArray(customerIdRaw) ? customerIdRaw[0] : customerIdRaw;
  const { items, receiverName, receiverPhone, address, totals, delivery } = req.body;

  let orderId;

  try {
    await db.runTransaction(async (transaction) => {
      // 1. Validate Inventory
      for (const item of items) {
        const productRef = db.collection(`tenants/${tenantId}/products`).doc(item.productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists) {
          throw new Error(`Product ${item.name} not found`);
        }
        
        const productData = productDoc.data();
        if (productData!.stock < item.qty) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }
      }

      // 2. Decrement Inventory
      for (const item of items) {
        const productRef = db.collection(`tenants/${tenantId}/products`).doc(item.productId);
        transaction.update(productRef, {
          stock: db.FieldValue.increment(-item.qty)
        });
      }

      // 3. Create Order
      orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
      const orderData = sanitize({
        id: orderId,
        customerId,
        customerName: receiverName,
        customerPhone: receiverPhone,
        address,
        items,
        total: totals?.total || 0,
        delivery,
        payment: {
          method: req.body.paymentMethod || 'COD',
          status: 'PENDING'
        },
        status: 'PENDING',
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      
      transaction.set(db.collection(`tenants/${tenantId}/orders`).doc(orderId), orderData);
      
      // Clear cart
      transaction.set(db.collection(`tenants/${tenantId}/carts`).doc(customerId), { items: [] });
    });
  } catch (error: any) {
    console.error("Order creation failed:", error);
    return res.status(400).json({ error: error.message || "Failed to create order" });
  }

  // Telegram Notification
  await sendTelegramMessage(customerId, `Order ${orderId} created successfully!`);
  
  res.json({ success: true, data: { id: orderId } });
};

const sanitize = (obj: any) => {
  const result: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        result[key] = sanitize(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  });
  return result;
};
