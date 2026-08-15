import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import crypto from "crypto";
import { sendTelegramMessage } from "./telegram.js";

const formatOrderNumber = (date: Date, timeZone: string, sequence = 0) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const base = `${value("day")}${value("month")}${value("year")}${value("hour")}${value("minute")}${value("second")}`;
  return sequence > 0 ? `${base}-${sequence + 1}` : base;
};

const buildReceiptReview = (orderId: string, current: Record<string, any>, imageBase64: string, verified?: boolean) => {
  const analysis = {
    referenceNumber: `PRIME-${orderId.slice(-4)}`,
    amount: current.total || 0,
    senderName: current.customerName || "Unknown Sender",
    verified: Boolean(verified ?? true),
    verdict: verified === false ? "UNVALIDATED" : "VALIDATED",
    analyzedAt: new Date().toISOString(),
  };

  return {
    receipt: { imageUrl: imageBase64, analysis },
    analysis,
  };
};

export const createOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerIdRaw = req.headers["x-customer-id"] || "preview-user-id";
  const customerId = Array.isArray(customerIdRaw) ? customerIdRaw[0] : customerIdRaw;
  const { items, receiverName, receiverPhone, address, totals, delivery, paymentMethod, receipt, payment, checkoutSessionId, paymentDraftId, proofId } = req.body;

  let orderId;
  const confirmationAt = new Date();
  const tenantSnapshot = await db.collection("tenants").doc(tenantId).get();
  const tenantData = tenantSnapshot.exists ? (tenantSnapshot.data() as Record<string, any>) : {};
  const timeZone = String(tenantData?.timezone || "Asia/Manila");
  const orderBase = formatOrderNumber(confirmationAt, timeZone);
  const existingOrders = await db.collection(`tenants/${tenantId}/orders`).get();
  const collisionCount = existingOrders.docs.filter((doc: any) => {
    const data = doc.data();
    return String(data?.orderNumber || "").startsWith(orderBase);
  }).length;
  const orderNumber = formatOrderNumber(confirmationAt, timeZone, collisionCount);
  const confirmationSnapshot = {
    orderNumber,
    orderBase,
    timeZone,
    confirmedAt: confirmationAt.toISOString(),
    paymentDraftId: paymentDraftId || null,
    checkoutSessionId: checkoutSessionId || null,
    paymentMethod: paymentMethod || null,
    quoteSnapshot: delivery || null,
    totalsSnapshot: totals || null,
  };

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
      const proofDoc = proofId ? await transaction.get(db.collection(`tenants/${tenantId}/payment_draft_proofs`).doc(String(proofId))) : null;
      const proofData = proofDoc?.exists ? (proofDoc.data() as Record<string, any>) : null;
      const receiptImageUrl = receipt?.imageUrl || proofData?.imageUrl || null;
      const orderData = sanitize({
        id: orderId,
        orderNumber,
        customerId,
        customerName: receiverName,
        customerPhone: receiverPhone,
        address,
        items,
        total: totals?.total || 0,
        delivery,
        payment: {
          method: paymentMethod || 'COD',
          status: payment?.status || (receiptImageUrl ? 'PENDING_REVIEW' : 'PENDING'),
          proofUrl: receiptImageUrl,
        },
        receipt: receipt || (receiptImageUrl ? { imageUrl: receiptImageUrl, proofId: proofId || proofData?.id || null } : null),
        checkoutSessionId: checkoutSessionId || null,
        paymentDraftId: paymentDraftId || null,
        confirmationSnapshot,
        status: receiptImageUrl ? 'payment_review' : 'PENDING',
        reviewStatus: receipt?.analysis?.verified ? 'VALIDATED' : receiptImageUrl ? 'UNVALIDATED' : null,
        queueStatus: receiptImageUrl ? 'ON_QUEUE' : 'DRAFT',
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      transaction.set(db.collection(`tenants/${tenantId}/orders`).doc(orderId), orderData);

      if (paymentDraftId) {
        transaction.set(db.collection(`tenants/${tenantId}/payment_drafts`).doc(paymentDraftId), {
          id: paymentDraftId,
          customerId,
          checkoutSessionId: checkoutSessionId || null,
          orderId,
          provider: paymentMethod || "manual",
          proofUrl: receiptImageUrl,
          amount: totals?.total || 0,
          quoteSnapshot: delivery || null,
          status: "submitted",
          confirmationSnapshot,
          updatedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
        });
      }

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

export const getOrdersHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const snapshot = await db.collection(`tenants/${tenantId}/orders`).get();
  const orders = snapshot.docs
    .map((doc: any) => doc.data())
    .filter(Boolean)
    .sort((left: any, right: any) => {
      const leftDate = new Date(left.date || 0).getTime();
      const rightDate = new Date(right.date || 0).getTime();
      return rightDate - leftDate;
    });

  return res.json({ data: orders });
};

export const getOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const snapshot = await db.collection(`tenants/${tenantId}/orders`).doc(orderId).get();

  if (!snapshot.exists) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json({ data: snapshot.data() });
};

export const updateOrderHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();

  if (!existing.exists) {
    return res.status(404).json({ error: "Order not found" });
  }

  const current = existing.data() as Record<string, any>;
  const patch = sanitize(req.body || {});
  const nextOrder = {
    ...current,
    ...patch,
    payment: patch.payment ? { ...current.payment, ...patch.payment } : current.payment,
    delivery: patch.delivery ? { ...current.delivery, ...patch.delivery } : current.delivery,
    receipt: patch.receipt ? { ...current.receipt, ...patch.receipt } : current.receipt,
    reviewStatus: patch.reviewStatus ?? current.reviewStatus ?? null,
    queueStatus: patch.queueStatus ?? current.queueStatus ?? null,
    updatedAt: new Date().toISOString()
  };

  await orderRef.set(nextOrder);
  return res.json({ success: true, data: nextOrder });
};

export const analyzeReceiptHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const { imageBase64 } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64" });
  }

  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();

  if (!existing.exists) {
    return res.status(404).json({ error: "Order not found" });
  }

  const current = existing.data() as Record<string, any>;
  const { receipt, analysis } = buildReceiptReview(orderId, current, imageBase64, true);

  await orderRef.set({
    ...current,
    receipt,
    payment: {
      ...current.payment,
      status: "VERIFIED"
    },
    reviewStatus: "VALIDATED",
    queueStatus: "ON_QUEUE",
    status: "payment_review",
    updatedAt: new Date().toISOString()
  });

  return res.json({ success: true, data: { orderId, receipt } });
};

export const finalizePaymentReviewHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();

  if (!existing.exists) {
    return res.status(404).json({ error: "Order not found" });
  }

  const current = existing.data() as Record<string, any>;
  const reviewStatus = current.receipt?.analysis?.verified ? "VALIDATED" : "UNVALIDATED";
  await orderRef.set({
    ...current,
    reviewStatus,
    queueStatus: "ON_QUEUE",
    status: "payment_review",
    updatedAt: new Date().toISOString(),
  });

  return res.json({ success: true, data: { orderId, reviewStatus } });
};

export const reviewQueueActionHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();

  if (!existing.exists) {
    return res.status(404).json({ error: "Order not found" });
  }

  const current = existing.data() as Record<string, any>;
  const action = String(req.body?.action || "").toLowerCase();
  const reason = req.body?.reason || null;
  const reviewerId = (req.headers["x-admin-id"] || req.headers["x-user-id"] || "system").toString();

  if (!["approve", "reject", "needs-review"].includes(action)) {
    return res.status(400).json({ error: "Invalid review action" });
  }

  const reviewStatus = action === "approve" ? "VALIDATED" : action === "reject" ? "UNVALIDATED" : "NEEDS_REVIEW";
  const queueStatus = action === "approve" ? "COMPLETED" : "ON_QUEUE";
  const reviewEvent = {
    action,
    reason,
    reviewerId,
    reviewedAt: new Date().toISOString(),
    previousReviewStatus: current.reviewStatus || null,
  };

  const next = {
    ...current,
    reviewStatus,
    queueStatus,
    payment: {
      ...current.payment,
      status: action === "approve" ? "VERIFIED" : action === "reject" ? "PENDING_REVIEW" : current.payment?.status || "PENDING_REVIEW",
    },
    reviewHistory: [...(current.reviewHistory || []), reviewEvent],
    reviewedBy: reviewerId,
    reviewedAt: reviewEvent.reviewedAt,
    updatedAt: reviewEvent.reviewedAt,
  };

  await orderRef.set(next);
  return res.json({ success: true, data: { orderId, reviewStatus, queueStatus, reviewEvent } });
};

export const createPaymentDraftHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = (req.headers["x-customer-id"] || "preview-user-id").toString();
  const draft = {
    id: crypto.randomUUID(),
    customerId,
    checkoutSessionId: req.body?.checkoutSessionId || null,
    orderId: req.body?.orderId || null,
    provider: req.body?.provider || "manual",
    status: "draft",
    proofUrl: req.body?.proofUrl || null,
    amount: Number(req.body?.amount || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.collection(`tenants/${tenantId}/payment_drafts`).doc(draft.id).set(draft);
  return res.json({ success: true, data: draft });
};

export const uploadProofHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();
  if (!existing.exists) return res.status(404).json({ error: "Order not found" });

  const current = existing.data() as Record<string, any>;
  const imageBase64 = req.body?.imageBase64;
  if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

  const proofVersion = Number(current.proofVersion || 0) + 1;
  const proof = {
    id: crypto.randomUUID(),
    orderId,
    paymentDraftId: current.paymentDraftId || null,
    version: proofVersion,
    imageUrl: imageBase64,
    source: req.body?.source || "customer",
    createdAt: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  };

  await db.collection(`tenants/${tenantId}/order_proofs`).doc(proof.id).set(proof);
  await orderRef.set({
    ...current,
    proofVersion,
    proofId: proof.id,
    receipt: {
      ...(current.receipt || {}),
      imageUrl: imageBase64,
      proofId: proof.id,
      version: proofVersion,
    },
    payment: {
      ...current.payment,
      proofUrl: imageBase64,
    },
    updatedAt: new Date().toISOString(),
  });

  return res.json({ success: true, data: proof });
};

export const reviewReceiptHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();
  if (!existing.exists) return res.status(404).json({ error: "Order not found" });
  const current = existing.data() as Record<string, any>;
  const imageBase64 = req.body?.imageBase64;
  if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });
  const { receipt, analysis } = buildReceiptReview(orderId, current, imageBase64, req.body?.verified);
  await orderRef.set({
    ...current,
    receipt,
    reviewStatus: analysis.verdict,
    queueStatus: "ON_QUEUE",
    status: "payment_review",
    payment: { ...current.payment, proofUrl: imageBase64, status: analysis.verdict === "VALIDATED" ? "VERIFIED" : "PENDING_REVIEW" },
    updatedAt: new Date().toISOString(),
  });
  return res.json({ success: true, data: { orderId, receipt } });
};

export const setOrderFulfillmentStatusHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();
  if (!existing.exists) return res.status(404).json({ error: "Order not found" });

  const current = existing.data() as Record<string, any>;
  const nextStatus = req.body?.status;

  if (!nextStatus) return res.status(400).json({ error: "Missing status" });

  // State machine enforcement
  const sequence = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'FOR_PICKUP', 'DISPATCHED', 'DELIVERED'];
  const currentIndex = sequence.indexOf(current.status);
  const nextIndex = sequence.indexOf(nextStatus);

  // Allow transitions if:
  // 1. It is the next sequential status
  // 2. It is a transition to a "HOLD" or "CANCELLED" status
  const isSequential = currentIndex !== -1 && nextIndex === currentIndex + 1;
  const isException = nextStatus.startsWith('HOLD_') || nextStatus === 'CANCELLED';

  if (!isSequential && !isException) {
      return res.status(400).json({ error: `Invalid status transition from ${current.status} to ${nextStatus}` });
  }

  const now = new Date().toISOString();
  const isQueueEntry = !current.queueEnteredAt && ["ON_QUEUE", "payment_review", "PENDING", "QUEUED"].includes(String(current.queueStatus || current.status));
  const nextQueueEnteredAt = current.queueEnteredAt || (isQueueEntry ? now : null);
  const nextReadyAt = nextStatus === "READY" ? (current.readyAt || now) : current.readyAt || null;
  const nextDispatchedAt = nextStatus === "DISPATCHED" ? (current.dispatchedAt || now) : current.dispatchedAt || null;
  const nextDeliveredAt = nextStatus === "DELIVERED" ? (current.deliveredAt || now) : current.deliveredAt || null;
  const nextQueueStatus = nextStatus === "DISPATCHED" || nextStatus === "DELIVERED" ? "COMPLETED" : (nextStatus === "READY" || nextStatus === "FOR_PICKUP" ? "READY" : current.queueStatus || "ON_QUEUE");

  await orderRef.set({
    ...current,
    status: nextStatus,
    queueStatus: nextQueueStatus,
    queueEnteredAt: nextQueueEnteredAt,
    readyAt: nextReadyAt,
    dispatchedAt: nextDispatchedAt,
    deliveredAt: nextDeliveredAt,
    updatedAt: now,
  });

  // Audit
  await db.collection(`tenants/${tenantId}/audit_events`).add({
    type: 'order_status_change',
    orderId,
    previousStatus: current.status,
    newStatus: nextStatus,
    timestamp: now
  });

  return res.json({ success: true, data: { orderId, status: nextStatus } });
};

export const createOrderAmendmentHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const orderId = req.params.id;
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const existing = await orderRef.get();
  if (!existing.exists) return res.status(404).json({ error: "Order not found" });
  const current = existing.data() as Record<string, any>;
  const amendment = {
    id: crypto.randomUUID(),
    orderId,
    patch: sanitize(req.body || {}),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  await db.collection(`tenants/${tenantId}/order_amendments`).doc(amendment.id).set(amendment);
  await orderRef.set({
    ...current,
    amendmentStatus: "pending",
    updatedAt: new Date().toISOString(),
  });
  return res.json({ success: true, data: amendment });
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
