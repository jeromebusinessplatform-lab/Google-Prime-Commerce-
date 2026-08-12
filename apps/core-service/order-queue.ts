import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

export const getOrderQueueSummaryHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  
  const snapshot = await db.collection(`tenants/${tenantId}/orders`).get();
  const docs = snapshot.docs.map((d: any) => d.data());

  const onQueueCount = docs.filter((o: any) => o.status === 'PENDING' || o.status === 'QUEUED').length;
  const processingCount = docs.filter((o: any) => o.status === 'PROCESSING').length;

  res.json({
    generated_at: new Date().toISOString(),
    metric_version: "1.0",
    scope_key: "default-store",
    on_queue_count: onQueueCount,
    processing_count: processingCount,
    estimated_wait_minutes: onQueueCount > 0 ? onQueueCount * 5 : 5,
    estimated_dispatch_minutes: processingCount > 0 ? processingCount * 3 : 5,
    wait_sample_size: 10,
    dispatch_sample_size: 8,
    active_load: onQueueCount + processingCount,
    traffic: (onQueueCount + processingCount) > 10 ? "HEAVY" : (onQueueCount + processingCount) > 5 ? "MODERATE" : "LIGHT",
    stale_after_seconds: 45
  });
};
