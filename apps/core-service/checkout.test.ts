import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { createCheckoutSessionHandler } from "./checkout.js";
import { createOrderHandler } from "./orders.js";
import { db } from "../../packages/db/index.js";

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
      async update(patch: any) {
        const current = readDoc(path) || {};
        const next = { ...current, ...patch };
        const parts = path.split("/");
        const coll = parts.slice(0, -1).join("/");
        if (!store.has(coll)) store.set(coll, new Map());
        store.get(coll)!.set(id, structuredClone(next));
      },
    };
  };

  const collection = (collPath: string) => ({
    doc: (id: string) => docHandle(`${collPath}/${id}`),
    async get() {
      const docs = [...(store.get(collPath) ?? new Map()).entries()].map(([id, data]) => ({
        id,
        exists: true,
        data: () => data,
      }));
      return { docs, empty: docs.length === 0 };
    },
    async add(data: any) {
      const id = `doc-${Math.random().toString(36).slice(2, 8)}`;
      await docHandle(`${collPath}/${id}`).set(data);
      return { id };
    },
  });

  const dbMock = {
    collection,
    FieldValue: { increment: (n: number) => ({ __increment: n }) },
    async runTransaction(callback: any) {
      return callback({
        async get(ref: { path: string }) {
          const data = readDoc(ref.path);
          return { exists: data !== undefined, data: () => data };
        },
        set(ref: { path: string }, data: any) {
          return docHandle(ref.path).set(data);
        },
        update(ref: { path: string }, patch: any) {
          return docHandle(ref.path).update(patch);
        },
      });
    },
    __resetDb: () => store.clear(),
  };

  return { db: dbMock, storage: null, firestoreDb: null };
});

vi.mock("./telegram.js", () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(undefined),
}));

const makeRes = () =>
  ({
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  }) as unknown as Response;

describe("checkout draft flow", () => {
  beforeEach(async () => {
    (db as any).__resetDb();
    await db.collection("tenants/default/products").doc("product-1").set({
      name: "Test Product",
      stock: 10,
    });
  });

  it("creates a checkout payment draft and links it to the final order", async () => {
    const checkoutRes = makeRes();
    await createCheckoutSessionHandler(
      {
        headers: { "x-customer-id": "customer-1" },
        body: {
          items: [{ id: "item-1", productId: "product-1", name: "Test Product", qty: 1, price: 100 }],
          paymentMethod: "card",
          amountDueNow: 123,
        },
      } as unknown as Request,
      checkoutRes
    );

    const checkoutPayload = (checkoutRes.json as any).mock.calls[0][0];
    expect(checkoutPayload.data.paymentDraftId).toBeTruthy();

    const orderRes = makeRes();
    await createOrderHandler(
      {
        headers: { "x-customer-id": "customer-1" },
        body: {
          items: [{ productId: "product-1", name: "Test Product", qty: 1, price: 100 }],
          receiverName: "Test Customer",
          receiverPhone: "09170000000",
          address: "Test Address",
          totals: { total: 100 },
          paymentMethod: "CARD",
          paymentDraftId: checkoutPayload.data.paymentDraftId,
          checkoutSessionId: checkoutPayload.data.id,
        },
      } as unknown as Request,
      orderRes
    );

    expect((orderRes.json as any).mock.calls[0][0]).toMatchObject({
      success: true,
      data: { id: expect.any(String) },
    });

    const drafts = await db.collection("tenants/default/payment_drafts").get();
    expect(drafts.docs[0].data()).toMatchObject({
      status: "submitted",
      orderId: expect.any(String),
      checkoutSessionId: checkoutPayload.data.id,
    });
  });
});
