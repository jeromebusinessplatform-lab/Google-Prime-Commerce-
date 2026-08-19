import { db } from "../../packages/db/index.js";
import { parseMayaSms } from "../sms-bridge/maya-sms.js";

export async function reconcilePayment(orderId: string, smsBody: string) {
  const tenantId = "default";
  
  // 1. Get order details
  const orderRef = db.collection(`tenants/${tenantId}/orders`).doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) return { matched: false, reason: "Order not found" };
  const order = orderDoc.data() as any;

  // 2. Parse SMS
  const smsData = parseMayaSms(smsBody);
  if (!smsData.paymentConfirmed) return { matched: false, reason: "SMS not a payment confirmation" };

  // 3. Get OCR proof
  const proofRef = db.collection(`tenants/${tenantId}/payment_draft_proofs`).where("orderId", "==", orderId).limit(1);
  const proofSnapshot = await proofRef.get();
  if (proofSnapshot.empty) return { matched: false, reason: "No OCR proof found" };
  const proof = proofSnapshot.docs[0].data() as any;
  const ocrText = proof.analysis?.parsedText || "";

  // 4. Custom Matching Constraint (Example)
  const amountMatch = smsData.amountMinor === Math.round(order.totals.total * 100);
  const refMatch = smsData.referenceCandidates.some((ref: string) => ocrText.includes(ref));
  
  const matched = amountMatch && refMatch;
  
  if (matched) {
    await orderRef.update({ status: "PAID", paymentValidatedBy: "SMS_OCR_MATCH" });
  }

  return { matched, amountMatch, refMatch };
}
