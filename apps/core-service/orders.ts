import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import crypto from "crypto";
import { sendTelegramMessage } from "./telegram.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const analyzeReceiptHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image data is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Extract payment details from this Philippine e-wallet (GCash/Maya) or Bank Transfer receipt. Return a JSON with: referenceNumber, amount, date, senderName, receiverName. If not found, use null.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(",")[1] || imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse analysis" };

    // Update order with receipt and analysis
    await db.collection(`tenants/${tenantId}/orders`).doc(id).update({
      receipt: {
        imageUrl: imageBase64, // In a real app, upload to storage first
        analysis,
        uploadedAt: new Date().toISOString()
      }
    });

    // Send Telegram Notification for Receipt
    if (analysis && !analysis.error) {
      const message = `<b>📄 RECEIPT ANALYZED: ${id}</b>\n\n` +
                     `💰 <b>Amount:</b> ₱${analysis.amount}\n` +
                     `🔢 <b>Ref:</b> ${analysis.referenceNumber}\n` +
                     `👤 <b>Sender:</b> ${analysis.senderName}\n\n` +
                     `<i>Check admin to verify and fulfill.</i>`;
      await sendTelegramMessage(message);
    }

    res.json({ data: analysis });
  } catch (e: any) {
    console.error("Receipt analysis error:", e);
    res.status(500).json({ error: e.message });
  }
};

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

export const updateOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const updateData = sanitize(req.body);
  
  await db.collection(`tenants/${tenantId}/orders`).doc(id).update(updateData);
  
  res.json({ success: true });
};

export const createOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerIdRaw = req.headers["x-customer-id"] || "preview-user-id";
  const customerId = Array.isArray(customerIdRaw) ? customerIdRaw[0] : customerIdRaw;
  const { items, receiverName, receiverPhone, address, totals, delivery } = req.body;
  
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  
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
  
  await db.collection(`tenants/${tenantId}/orders`).doc(orderId).set(orderData);
  
  // Clear cart
  await db.collection(`tenants/${tenantId}/carts`).doc(customerId).set({ items: [] });
  
  // Send Telegram Notification
  const itemList = items.map((i: any) => `- ${i.qty}x ${i.name}`).join("\n");
  const message = `<b>🛍 NEW ORDER: ${orderId}</b>\n\n` +
                 `👤 <b>Customer:</b> ${receiverName}\n` +
                 `📞 <b>Phone:</b> ${receiverPhone}\n` +
                 `📍 <b>Address:</b> ${address}\n\n` +
                 `📦 <b>Items:</b>\n${itemList}\n\n` +
                 `💰 <b>Total:</b> ₱${(totals?.total || 0).toLocaleString()}\n` +
                 `🚚 <b>Courier:</b> ${delivery?.courierName || 'SELF-PICKUP'}\n` +
                 `💳 <b>Payment:</b> ${orderData.payment.method}`;
  
  await sendTelegramMessage(message);
  
  res.json({ data: orderData });
};
