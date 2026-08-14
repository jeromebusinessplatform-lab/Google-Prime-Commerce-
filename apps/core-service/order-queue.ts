import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

export const getOrderQueueSummaryHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  
  const snapshot = await db.collection(`tenants/${tenantId}/orders`).get();
  const docs = snapshot.docs.map((d: any) => d.data());

  const onQueueCount = docs.filter((o: any) => o.queueStatus === 'ON_QUEUE' || o.status === 'payment_review' || o.status === 'PENDING' || o.status === 'QUEUED').length;
  const processingCount = docs.filter((o: any) => o.status === 'PROCESSING' || o.status === 'PREPARING').length;
  const readyCount = docs.filter((o: any) => o.status === 'READY').length;
  const dispatchedCount = docs.filter((o: any) => o.status === 'DISPATCHED').length;
  const onHoldCount = docs.filter((o: any) => o.status === 'HOLD').length;
  const startDates = docs.map((o: any) => o.queueEnteredAt).filter(Boolean);
  const endDates = docs.map((o: any) => o.dispatchedAt).filter(Boolean);

  res.json({
    generated_at: new Date().toISOString(),
    metric_version: "1.0",
    scope_key: "default-store",
    on_queue_count: onQueueCount,
    processing_count: processingCount,
    ready_count: readyCount,
    dispatched_count: dispatchedCount,
    hold_count: onHoldCount,
    estimated_wait_minutes: onQueueCount > 0 ? onQueueCount * 5 : null,
    estimated_dispatch_minutes: processingCount > 0 ? processingCount * 3 : null,
    wait_sample_size: 10,
    dispatch_sample_size: 8,
    active_load: onQueueCount + processingCount,
    traffic: (onQueueCount + processingCount) > 10 ? "HEAVY" : (onQueueCount + processingCount) > 5 ? "MODERATE" : "LIGHT",
    stale_after_seconds: 45,
    avg_queue_minutes: startDates.length && endDates.length ? Math.round((new Date(endDates[0]).getTime() - new Date(startDates[0]).getTime()) / 60000) : null,
  });
};
