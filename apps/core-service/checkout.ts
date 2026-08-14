import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import { calculateDeliveryFee } from "../../packages/domain/delivery-formula.js";
import crypto from "crypto";

export const createCheckoutSessionHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = req.headers["x-customer-id"] || "preview-user-id";
  const existingDraftId = req.body?.paymentDraftId || null;
  const paymentMethod = req.body?.paymentMethod || null;
  const selectedQuote = req.body?.selectedQuote || null;
  
  // Minimal session implementation for preview
  const sessionId = crypto.randomUUID();
  const sessionData = {
    id: sessionId,
    customerId,
    status: "active",
    items: req.body.items || [],
    deliveryInfo: null,
    promoCode: null,
    referralCode: null,
    selectedQuote,
    paymentMethod,
    paymentDraftId: existingDraftId,
    totals: { subtotal: 0, deliveryFee: 0, discount: 0, total: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await db.collection(`tenants/${tenantId}/checkout_sessions`).doc(sessionId).set(sessionData);

  const draft = existingDraftId
    ? await db.collection(`tenants/${tenantId}/payment_drafts`).doc(existingDraftId).get()
    : null;

  if (!existingDraftId || !draft?.exists) {
    const paymentDraftId = crypto.randomUUID();
    const paymentDraft = {
      id: paymentDraftId,
      customerId,
      checkoutSessionId: sessionId,
      orderId: null,
      provider: paymentMethod || "manual",
      quoteSnapshot: selectedQuote,
      status: "draft",
      proofUrl: null,
      amount: Number(req.body?.amountDueNow || req.body?.totals?.total || 0),
      selectedItemIds: (req.body?.selectedItemIds || []).slice?.() || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection(`tenants/${tenantId}/payment_drafts`).doc(paymentDraftId).set(paymentDraft);
    sessionData.paymentDraftId = paymentDraftId;
    await db.collection(`tenants/${tenantId}/checkout_sessions`).doc(sessionId).set(sessionData);
  } else {
    sessionData.paymentDraftId = existingDraftId;
  }

  res.json({ data: sessionData });
};

export const updateCheckoutSessionHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const sessionId = req.params.id;
  const ref = db.collection(`tenants/${tenantId}/checkout_sessions`).doc(sessionId);
  const existing = await ref.get();
  if (!existing.exists) return res.status(404).json({ error: "Checkout session not found" });
  const current = existing.data() as Record<string, any>;
  const patch = {
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  const next = { ...current, ...patch };
  await ref.set(next);

  if (patch.paymentDraftId) {
    const draftRef = db.collection(`tenants/${tenantId}/payment_drafts`).doc(String(patch.paymentDraftId));
    const draft = await draftRef.get();
    if (draft.exists) {
      await draftRef.set({
        ...(draft.data() as Record<string, any>),
        checkoutSessionId: sessionId,
        selectedQuote: patch.selectedQuote || (draft.data() as any)?.selectedQuote || null,
        provider: patch.paymentMethod || (draft.data() as any)?.provider || "manual",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  res.json({ success: true, data: next });
};

export const listCheckoutDraftsHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const customerId = req.headers["x-customer-id"] || "preview-user-id";
  const snapshot = await db.collection(`tenants/${tenantId}/payment_drafts`).get();
  const drafts = snapshot.docs
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .filter((draft: any) => draft.customerId === customerId);
  res.json({ data: drafts });
};
