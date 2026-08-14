import crypto from "crypto";
import { db } from "../db/index.js";
import { env } from "../config/env.js";
import { TenantContext } from "../contracts/tenant.js";

export interface AuditEventInput {
  actorType: "customer" | "operator" | "system" | "scheduled_job" | "queue_job" | "provider_webhook" | "support_process";
  actorId?: string;
  telegramUserId?: string;
  operatorRole?: string;
  sourceChannel: "telegram_storefront" | "admin" | "pos" | "api" | "job" | "webhook" | "migration";
  sessionId?: string;
  requestId?: string;
  idempotencyKey?: string;
  category: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  reasonCode?: string;
  outcome: "succeeded" | "denied" | "failed" | "conflicted" | "reversed" | "expired";
  errorCode?: string;
}

export async function appendAuditEvent(tenantCtx: TenantContext, eventInput: AuditEventInput) {
  const collectionRef = db.collection(`tenants/${tenantCtx.tenantId}/audit_events`);
  
  // To strictly sequence events, we need the previous event's hash. 
  // For a distributed DB like Firestore, doing this exactly requires a transaction on a single document 
  // acting as a sequence counter, or appending to a subcollection of a specific partition.
  // We'll simulate it by getting the latest event in a transaction.
  
  // Simulated here for greenfield:
  const latestQuery = await collectionRef.get();
  let previousHash = "GENESIS";
  let sequence = 1;
  
  if (!latestQuery.empty) {
    const latestEvent = [...latestQuery.docs]
      .map((doc: any) => doc.data() as any)
      .sort((a: any, b: any) => Number(b.sequence || 0) - Number(a.sequence || 0))[0];
    previousHash = latestEvent.currentHash || "GENESIS";
    sequence = (latestEvent.sequence || 0) + 1;
  }

  const occurredAt = new Date().toISOString();
  
  const rawEventObj = {
    ...eventInput,
    tenantId: tenantCtx.tenantId,
    sequence,
    occurredAt,
    schemaVersion: "1.0"
  };

  const canonicalString = JSON.stringify(rawEventObj, Object.keys(rawEventObj).sort());
  
  // HMAC with the pepper/audit integrity key
  const auditKey = env.ADMIN_CODE_PEPPER || "test-integrity-key";
  const hmac = crypto.createHmac("sha256", auditKey);
  hmac.update(previousHash);
  hmac.update(canonicalString);
  const currentHash = hmac.digest("hex");

  const finalEvent = {
    ...rawEventObj,
    previousHash,
    currentHash,
    recordedAt: new Date().toISOString(),
  };

  await collectionRef.add(finalEvent);
  return finalEvent;
}
