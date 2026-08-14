import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { createOrderHandler, getOrdersHandler, getOrderHandler, updateOrderHandler, analyzeReceiptHandler, reviewReceiptHandler, reviewQueueActionHandler } from './orders';
import { db } from '../../packages/db/index';

vi.mock('../../packages/db/index', () => {
  const store = new Map<string, Map<string, any>>();

  const readDoc = (path: string) => {
    const parts = path.split('/');
    const coll = parts.slice(0, -1).join('/');
    const id = parts[parts.length - 1];
    return store.get(coll)?.get(id);
  };

  const upsertDoc = (path: string) => {
    const parts = path.split('/');
    const coll = parts.slice(0, -1).join('/');
    const id = parts[parts.length - 1];
    if (!store.has(coll)) store.set(coll, new Map());
    const collMap = store.get(coll)!;
    if (!collMap.has(id)) collMap.set(id, {});
    return collMap.get(id)!;
  };

  const applyPatch = (target: any, patch: any) => {
    for (const [key, value] of Object.entries(patch)) target[key] = value;
  };

  const docHandle = (path: string) => {
    const id = path.split('/').pop()!;
    return {
      id,
      path,
      async get() {
        const data = readDoc(path);
        return { id, exists: data !== undefined, data: () => data };
      },
      async set(data: any) {
        const parts = path.split('/');
        const coll = parts.slice(0, -1).join('/');
        if (!store.has(coll)) store.set(coll, new Map());
        store.get(coll)!.set(id, structuredClone(data));
      },
      async update(patch: any) {
        applyPatch(upsertDoc(path), patch);
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
  });

  const dbMock = {
    collection,
    FieldValue: { increment: (n: number) => ({ __increment: n }) },
    async runTransaction<T>(callback: (txn: any) => Promise<T>): Promise<T> {
      return callback({
        async get(ref: { path: string }) {
          const data = readDoc(ref.path);
          return { exists: data !== undefined, data: () => data };
        },
        set(ref: { path: string }, data: any) {
          const doc = docHandle(ref.path);
          return doc.set(data);
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

vi.mock('./telegram', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(undefined),
}));

const makeRes = () =>
  ({
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  }) as unknown as Response;

describe('orders API handlers', () => {
  const tenantId = 'default';
  const orderId = 'ORD-9001';
  const anyDb = db as any;
  const orderPath = `tenants/${tenantId}/orders`;
  const productPath = `tenants/${tenantId}/products`;

  beforeEach(async () => {
    anyDb.__resetDb();
    await db.collection(productPath).doc('product-1').set({
      name: 'Test Product',
      stock: 10,
    });
    await db.collection(orderPath).doc(orderId).set({
      id: orderId,
      customerId: 'customer-1',
      customerName: 'Test Customer',
      customerPhone: '09170000000',
      address: 'Test Address',
      items: [{ productId: 'product-1', name: 'Test Product', qty: 1, price: 100 }],
      total: 100,
      delivery: { fee: 25 },
      payment: { method: 'COD', status: 'PENDING' },
      status: 'PENDING',
      date: '2026-08-14T00:00:00.000Z',
    });
  });

  it('lists orders in newest-first order', async () => {
    await db.collection(orderPath).doc('ORD-9002').set({
      id: 'ORD-9002',
      date: '2026-08-14T02:00:00.000Z',
      total: 200,
    });

    const res = makeRes();
    await getOrdersHandler({} as Request, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ id: 'ORD-9002' })]),
      })
    );
  });

  it('returns a single order by id', async () => {
    const res = makeRes();
    await getOrderHandler({ params: { id: orderId } } as unknown as Request, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: orderId }),
      })
    );
  });

  it('updates order status and nested fields', async () => {
    const res = makeRes();
    await updateOrderHandler(
      {
        params: { id: orderId },
        body: {
          status: 'CONFIRMED',
          payment: { status: 'PAID' },
        },
      } as unknown as Request,
      res
    );

    const updated = await db.collection(orderPath).doc(orderId).get();
    expect(updated.data()).toMatchObject({
      status: 'CONFIRMED',
      payment: { method: 'COD', status: 'PAID' },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('analyzes receipt payload and marks payment verified', async () => {
    const res = makeRes();
    await analyzeReceiptHandler(
      {
        params: { id: orderId },
        body: { imageBase64: 'data:image/png;base64,AAA' },
      } as unknown as Request,
      res
    );

    const updated = await db.collection(orderPath).doc(orderId).get();
    expect(updated.data()).toMatchObject({
      receipt: expect.objectContaining({
        imageUrl: 'data:image/png;base64,AAA',
        analysis: expect.objectContaining({
          verified: true,
        }),
      }),
      payment: { method: 'COD', status: 'VERIFIED' },
    });
  });

  it('preserves an unvalidated verdict when review is manually rejected', async () => {
    const res = makeRes();
    await reviewReceiptHandler(
      {
        params: { id: orderId },
        body: { imageBase64: 'data:image/png;base64,BBB', verified: false },
      } as unknown as Request,
      res
    );

    const updated = await db.collection(orderPath).doc(orderId).get();
    expect(updated.data()).toMatchObject({
      receipt: expect.objectContaining({
        analysis: expect.objectContaining({
          verified: false,
          verdict: 'UNVALIDATED',
        }),
      }),
      reviewStatus: 'UNVALIDATED',
      payment: { method: 'COD', status: 'PENDING_REVIEW' },
    });
  });

  it('persists review queue actions with reviewer metadata', async () => {
    const res = makeRes();
    await reviewQueueActionHandler(
      {
        params: { id: orderId },
        headers: { 'x-admin-id': 'admin-1' },
        body: { action: 'approve', reason: 'Valid proof' },
      } as unknown as Request,
      res
    );

    const updated = await db.collection(orderPath).doc(orderId).get();
    expect(updated.data()).toMatchObject({
      reviewStatus: 'VALIDATED',
      reviewedBy: 'admin-1',
      reviewHistory: expect.arrayContaining([
        expect.objectContaining({
          action: 'approve',
          reason: 'Valid proof',
          reviewerId: 'admin-1',
        }),
      ]),
    });
  });
});
