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

export const uploadDraftProofHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const draftId = req.params.id;
  const draftRef = db.collection(`tenants/${tenantId}/payment_drafts`).doc(draftId);
  const existing = await draftRef.get();

  if (!existing.exists) {
    return res.status(404).json({ error: "Payment draft not found" });
  }

  const current = existing.data() as Record<string, any>;
  const imageBase64 = req.body?.imageBase64;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64" });
  }

  const proofVersion = Number(current.proofVersion || 0) + 1;
  const proof = {
    id: crypto.randomUUID(),
    draftId,
    checkoutSessionId: current.checkoutSessionId || null,
    orderId: current.orderId || null,
    version: proofVersion,
    imageUrl: imageBase64,
    source: req.body?.source || "customer",
    createdAt: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  };

  await db.collection(`tenants/${tenantId}/payment_draft_proofs`).doc(proof.id).set(proof);
  await draftRef.set({
    ...current,
    proofId: proof.id,
    proofVersion,
    proofUrl: imageBase64,
    updatedAt: new Date().toISOString(),
  });

  return res.json({ success: true, data: proof });
};

export const analyzeDraftProofHandler = async (req: Request, res: Response) => {
  const imageBase64 = req.body?.imageBase64;
  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64" });
  }

  const apiKey = process.env.RECEIPT_OCR_API || process.env.RECEIPT_ANALYZER_API_KEY || "";
  if (!apiKey) {
    return res.status(503).json({ error: "Receipt OCR is not configured" });
  }

  try {
    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("base64Image", imageBase64);

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    const parsedText = payload?.ParsedResults?.[0]?.ParsedText || "";
    const analysis = {
      provider: "ocr.space",
      parsedText,
      verified: Boolean(parsedText.trim()),
      verdict: parsedText.trim() ? "VALIDATED" : "UNVALIDATED",
      confidence: payload?.ParsedResults?.[0]?.TextOverlay?.Lines?.length ? "processed" : "unknown",
      raw: payload,
      analyzedAt: new Date().toISOString(),
    };

    return res.json({ success: true, data: analysis });
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      data: {
        provider: "ocr.space",
        verified: false,
        verdict: "UNVALIDATED",
        error: error?.message || "Receipt analysis failed",
        analyzedAt: new Date().toISOString(),
      },
    });
  }
};
