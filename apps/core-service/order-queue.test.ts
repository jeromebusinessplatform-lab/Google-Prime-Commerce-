import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { getOrderQueueSummaryHandler } from "./order-queue.js";
import { setOrderFulfillmentStatusHandler } from "./orders.js";
import { db } from "../../packages/db/index.js";

const makeRes = () =>
  ({
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  }) as unknown as Response;

vi.mock("../../packages/db/index.js", () => {
  const store = new Map<string, Map<string, any>>();

  const readDoc = (path: string) => {
    const parts = path.split("/");
    const coll = parts.slice(0, -1).join("/");
    const id = parts[parts.length - 1];
    return store.get(coll)?.get(id);
  };

  const docHandle = (path: string) => {
    const id = path.split("/").pop()!;
    return {
      id,
      path,
      async get() {
        const data = readDoc(path);
        return { id, exists: data !== undefined, data: () => data };
      },
      async set(data: any) {
        const parts = path.split("/");
        const coll = parts.slice(0, -1).join("/");
        if (!store.has(coll)) store.set(coll, new Map());
        store.get(coll)!.set(id, structuredClone(data));
      },
    };
  };

  const collection = (collPath: string) => ({
    doc: (id: string) => docHandle(`${collPath}/${id}`),
    async add(data: any) {
        const id = `id-${Math.random()}`;
        const doc = docHandle(`${collPath}/${id}`);
        await doc.set(data);
        return { id };
    },
    async get() {
      const docs = [...(store.get(collPath) ?? new Map()).entries()].map(([id, data]) => ({
        id,
        exists: true,
        data: () => data,
      }));
      return { docs, empty: docs.length === 0 };
    },
  });

  return {
    db: {
      collection,
      __resetDb: () => store.clear(),
    },
  };
});

describe("order queue summary", () => {
  beforeEach(async () => {
    (db as any).__resetDb();
    await db.collection("tenants/default/orders").doc("ORD-1000").set({
      id: "ORD-1000",
      status: "PENDING",
      queueStatus: "ON_QUEUE",
      queueEnteredAt: "2026-08-14T01:00:00.000Z",
    });
  });

  it("tracks persisted queue timestamps across fulfillment states", async () => {
    // Sequence: PENDING -> CONFIRMED -> PREPARING -> READY
    const statuses = ['CONFIRMED', 'PREPARING', 'READY'];
    for (const status of statuses) {
        await setOrderFulfillmentStatusHandler(
          {
            params: { id: "ORD-1000" },
            body: { status },
          } as unknown as Request,
          makeRes()
        );
    }

    const updated = await db.collection("tenants/default/orders").doc("ORD-1000").get();
    expect(updated.data()).toMatchObject({
      status: "READY",
      queueStatus: "READY",
      queueEnteredAt: "2026-08-14T01:00:00.000Z",
      readyAt: expect.any(String),
    });
  });

  it("derives queue summary from persisted timestamps", async () => {
    await db.collection("tenants/default/orders").doc("ORD-1001").set({
      id: "ORD-1001",
      status: "DISPATCHED",
      queueStatus: "COMPLETED",
      queueEnteredAt: "2026-08-14T01:00:00.000Z",
      readyAt: "2026-08-14T01:05:00.000Z",
      dispatchedAt: "2026-08-14T01:10:00.000Z",
    });

    const res = makeRes();
    await getOrderQueueSummaryHandler({} as Request, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        queue_entry_sample_size: 2,
        ready_sample_size: 1,
        dispatched_sample_size: 1,
        delivered_sample_size: 0,
        avg_queue_minutes: expect.any(Number),
      })
    );
  });
});
