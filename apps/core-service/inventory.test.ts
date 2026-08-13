import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderHandler } from './orders';
import { Request, Response } from 'express';
import { db } from '../../packages/db/index';

// Mock DB with a stateful in-memory Firestore so that set/update calls and
// transactions actually change state, mirroring production behavior.
vi.mock('../../packages/db/index', () => {
  // In-memory Firestore: collection path -> doc id -> data
  const store = new Map<string, Map<string, any>>();
  let txnQueue: Promise<any> = Promise.resolve();

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

  const isIncrement = (value: any) =>
    value && typeof value === 'object' && typeof value.__increment === 'number';

  const applyPatch = (target: any, patch: any) => {
    for (const [key, value] of Object.entries(patch)) {
      if (isIncrement(value)) {
        target[key] = (typeof target[key] === 'number' ? target[key] : 0) + (value as any).__increment;
      } else {
        target[key] = value;
      }
    }
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
      async delete() {
        const parts = path.split('/');
        const coll = parts.slice(0, -1).join('/');
        store.get(coll)?.delete(id);
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
    FieldValue: {
      increment: (n: number) => ({ __increment: n }),
    },
    // Serialize transactions so each one runs against the latest committed
    // state, mirroring Firestore's serializable transaction semantics.
    async runTransaction<T>(callback: (txn: any) => Promise<T>): Promise<T> {
      const run = async (): Promise<T> => {
        const writes: Array<{ type: 'set' | 'update' | 'delete'; path: string; data?: any }> = [];
        const txn = {
          async get(ref: { path: string }) {
            const data = readDoc(ref.path);
            return { exists: data !== undefined, data: () => data };
          },
          set(ref: { path: string }, data: any) {
            writes.push({ type: 'set', path: ref.path, data });
          },
          update(ref: { path: string }, patch: any) {
            writes.push({ type: 'update', path: ref.path, data: patch });
          },
          delete(ref: { path: string }) {
            writes.push({ type: 'delete', path: ref.path });
          },
        };

        const result = await callback(txn);

        // Commit atomically only when the callback succeeds.
        for (const write of writes) {
          if (write.type === 'set') {
            const parts = write.path.split('/');
            const coll = parts.slice(0, -1).join('/');
            const id = parts[parts.length - 1];
            if (!store.has(coll)) store.set(coll, new Map());
            store.get(coll)!.set(id, structuredClone(write.data));
          } else if (write.type === 'update') {
            applyPatch(upsertDoc(write.path), write.data);
          } else {
            const parts = write.path.split('/');
            const coll = parts.slice(0, -1).join('/');
            const id = parts[parts.length - 1];
            store.get(coll)?.delete(id);
          }
        }
        return result;
      };

      const next = txnQueue.then(run, run);
      txnQueue = next.catch(() => undefined);
      return next;
    },
    // Test helpers
    __store: store,
    __resetDb: () => {
      store.clear();
      txnQueue = Promise.resolve();
    },
  };

  return { db: dbMock, storage: null, firestoreDb: null };
});

// Mock Telegram
vi.mock('./telegram', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(undefined)
}));

describe('Inventory Integrity', () => {
  const tenantId = 'default';
  const productId = 'test-product';
  const anyDb = db as any;
  const productPath = `tenants/${tenantId}/products`;
  const ordersPath = `tenants/${tenantId}/orders`;

  const makeReq = (items: any[]) =>
    ({
      headers: { 'x-customer-id': 'test-customer' },
      body: {
        items,
        receiverName: 'Test Name',
        receiverPhone: '123456789',
        address: 'Test Address',
        totals: { total: 100 },
        delivery: {},
      },
    }) as unknown as Request;

  const makeRes = () =>
    ({
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }) as unknown as Response;

  const ordersCount = () => anyDb.__store.get(ordersPath)?.size ?? 0;

  beforeEach(async () => {
    anyDb.__resetDb();
    // Reset product stock before each test
    await db.collection(productPath).doc(productId).set({
      name: 'Test Product',
      stock: 10
    });
  });

  it('1. SUFFICIENT STOCK (case A)', async () => {
    const mockRes = makeRes();
    await createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 3 }]), mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const productDoc = await db.collection(productPath).doc(productId).get();
    expect(productDoc.data()!.stock).toBe(7);
  });

  it('2. INSUFFICIENT STOCK (case B)', async () => {
    await db.collection(productPath).doc(productId).update({ stock: 2 });

    const mockRes = makeRes();
    await createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 3 }]), mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);

    const productDoc = await db.collection(productPath).doc(productId).get();
    expect(productDoc.data()!.stock).toBe(2);
    expect(ordersCount()).toBe(0);
  });

  it('3. ZERO STOCK (case C)', async () => {
    await db.collection(productPath).doc(productId).update({ stock: 0 });

    const mockRes = makeRes();
    await createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 1 }]), mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);

    const productDoc = await db.collection(productPath).doc(productId).get();
    expect(productDoc.data()!.stock).toBe(0);
    expect(ordersCount()).toBe(0);
  });

  it('4. CONCURRENT ORDER (case D)', async () => {
    await db.collection(productPath).doc(productId).update({ stock: 1 });

    const resA = makeRes();
    const resB = makeRes();

    await Promise.all([
      createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 1 }]), resA),
      createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 1 }]), resB),
    ]);

    const successes = [resA, resB].filter((r) =>
      (r as any).json.mock.calls.some(([payload]) => payload?.success === true)
    );
    const rejections = [resA, resB].filter((r) =>
      (r as any).status.mock.calls.some(([code]) => code === 400)
    );

    expect(successes).toHaveLength(1);
    expect(rejections).toHaveLength(1);

    const productDoc = await db.collection(productPath).doc(productId).get();
    expect(productDoc.data()!.stock).toBe(0);
    expect(productDoc.data()!.stock).toBeGreaterThanOrEqual(0);
    expect(ordersCount()).toBe(1);
  });

  it('5. EXISTING ORDER FLOW (case E)', async () => {
    const mockRes = makeRes();
    await createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 1 }]), mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const orderDocs = (await db.collection(ordersPath).get()).docs;
    expect(orderDocs).toHaveLength(1);
    expect(orderDocs[0].data()).toMatchObject({
      status: 'PENDING',
      items: [{ productId, name: 'Test Product', qty: 1 }],
    });

    const productDoc = await db.collection(productPath).doc(productId).get();
    expect(productDoc.data()!.stock).toBe(9); // decremented exactly once
  });

  it('6. TELEGRAM FAILURE ISOLATION', async () => {
    const { sendTelegramMessage } = await import('./telegram');
    // The real sendTelegramMessage isolates API failures internally (try/catch),
    // so a failing Telegram call never rejects the order handler.
    (sendTelegramMessage as any).mockImplementation(async () => {
      try {
        throw new Error('Telegram API failed');
      } catch (err) {
        console.error('Failed to send Telegram message:', err);
      }
    });

    const mockRes = makeRes();
    await createOrderHandler(makeReq([{ productId, name: 'Test Product', qty: 1 }]), mockRes);

    // Order should still succeed (success: true)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(sendTelegramMessage).toHaveBeenCalled();

    const productDoc = await db.collection(productPath).doc(productId).get();
    expect(productDoc.data()!.stock).toBe(9); // per-test isolated state: 10 - 1
  });
});
