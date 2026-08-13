import { describe, it, expect, beforeAll, beforeEach } from "vitest";

// Force the in-memory local driver regardless of CI env.
process.env.DB_PATH = ":memory:";

let db: any;
let wipe: () => Promise<void>;

beforeAll(async () => {
  const mod = await import("./index.js");
  db = mod.db;
  const { getDriver } = await import("./index.js");
  const drv = await getDriver();
  wipe = () => drv.run("DELETE FROM documents");
});

beforeEach(async () => {
  await wipe();
});

describe("D1/SQLite adapter (Firestore-compatible facade)", () => {
  it("adds a document with an auto-generated id and reads it back", async () => {
    const ref = await db.collection("tenants/default/products").add({
      name: "Milk",
      price: 2.5,
      deletedAt: null,
    });

    expect(typeof ref.id).toBe("string");
    expect(ref.id.length).toBeGreaterThan(0);

    const doc = await db.collection("tenants/default/products").doc(ref.id).get();
    expect(doc.exists).toBe(true);
    expect(doc.id).toBe(ref.id);
    expect(doc.data().name).toBe("Milk");
    expect(doc.data().price).toBe(2.5);

    const missing = await db.collection("tenants/default/products").doc("nope").get();
    expect(missing.exists).toBe(false);
  });

  it("supports doc(id).set with replace and merge semantics", async () => {
    const coll = db.collection("tenants/default/carts");
    const docRef = coll.doc("user-1");

    await docRef.set({ items: [], profile: { name: "Alice", tier: "BASIC" } });
    expect((await docRef.get()).data().profile.tier).toBe("BASIC");

    // Plain set replaces the whole document
    await docRef.set({ items: ["a"] });
    const replaced = (await docRef.get()).data();
    expect(replaced.items).toEqual(["a"]);
    expect(replaced.profile).toBeUndefined();
  });

  it("filters with == including null (missing field treated as null)", async () => {
    const coll = db.collection("tenants/default/products");
    await coll.add({ name: "A", deletedAt: null });
    await coll.add({ name: "B", deletedAt: "2026-01-01T00:00:00.000Z" });
    await coll.add({ name: "C" });

    const live = await coll.where("deletedAt", "==", null).get();
    expect(live.docs.map((d: any) => d.data().name).sort()).toEqual(["A", "C"]);

    const archived = await coll.where("deletedAt", "==", "2026-01-01T00:00:00.000Z").get();
    expect(archived.docs.length).toBe(1);
    expect(archived.docs[0].data().name).toBe("B");
  });

  it("supports array-contains against a JSON array field", async () => {
    const coll = db.collection("tenants/default/orders");
    // Firestore array-contains matches whole elements (exact JSON equality).
    await coll.add({ items: [{ productId: "p1" }, { productId: "p2" }] });
    await coll.add({ items: [{ productId: "p3" }] });

    const snap = await coll.where("items", "array-contains", { productId: "p1" }).get();
    expect(snap.docs.length).toBe(1);
    expect(snap.docs[0].data().items.length).toBe(2);

    const none = await coll.where("items", "array-contains", { productId: "zzz" }).get();
    expect(none.empty).toBe(true);
  });

  it("orders by field asc/desc and applies limit", async () => {
    const coll = db.collection("tenants/default/categories");
    await coll.add({ name: "First", order: 1 });
    await coll.add({ name: "Second", order: 2 });
    await coll.add({ name: "Third", order: 3 });

    const asc = await coll.orderBy("order", "asc").get();
    expect(asc.docs.map((d: any) => d.data().name)).toEqual(["First", "Second", "Third"]);

    const desc = await coll.orderBy("order", "desc").get();
    expect(desc.docs[0].data().name).toBe("Third");

    const limited = await coll.orderBy("order", "asc").limit(2).get();
    expect(limited.docs.length).toBe(2);
  });

  it("updates fields, dotted paths, and FieldValue.increment", async () => {
    const coll = db.collection("tenants/default/products");
    const ref = await coll.add({ name: "Stocked", stock: 10, telegramProfile: { firstName: "Bob" } });

    await ref.update({ stock: db.FieldValue.increment(-4) });
    expect((await ref.get()).data().stock).toBe(6);

    await ref.update({ stock: db.FieldValue.increment(10) });
    expect((await ref.get()).data().stock).toBe(16);

    await ref.update({ "telegramProfile.firstName": "Alice", status: "active" });
    const data = (await ref.get()).data();
    expect(data.telegramProfile.firstName).toBe("Alice");
    expect(data.status).toBe("active");
    expect(data.name).toBe("Stocked");
  });

  it("deletes documents and reports snapshots empty", async () => {
    const coll = db.collection("tenants/default/carts");
    const ref = await coll.add({ items: [] });
    await ref.delete();

    const snap = await coll.get();
    expect(snap.empty).toBe(true);

    const doc = await coll.doc(ref.id).get();
    expect(doc.exists).toBe(false);
  });

  it("commits batches atomically, including increment patches", async () => {
    const coll = db.collection("tenants/default/bulk");
    const a = coll.doc("a");
    const b = coll.doc("b");

    const batch = db.batch();
    batch.set(a, { count: 0, name: "A" });
    batch.update(b, { count: db.FieldValue.increment(2) });
    await batch.commit();

    expect((await a.get()).data().count).toBe(0);
    expect((await b.get()).data().count).toBe(2);

    // batch.update on refs returned from a snapshot
    const snap = await coll.get();
    const batch2 = db.batch();
    snap.docs.forEach((d: any) => batch2.update(d.ref, { flagged: true }));
    await batch2.commit();
    expect((await a.get()).data().flagged).toBe(true);
    expect((await b.get()).data().flagged).toBe(true);
  });

  it("runs transactions with get/set/update/delete and rolls back on error", async () => {
    const coll = db.collection("tenants/default/orders");
    const productRef = coll.doc("prod-1");
    await productRef.set({ stock: 5 });

    await db.runTransaction(async (txn: any) => {
      const productDoc = await txn.get(productRef);
      expect(productDoc.exists).toBe(true);
      if (!productDoc.exists) throw new Error("missing");

      txn.update(productRef, { stock: db.FieldValue.increment(-2) });
      txn.set(coll.doc("ord-1"), { items: [], status: "PENDING" });
      txn.set(db.collection("tenants/default/carts").doc("user-1"), { items: [] });
    });

    expect((await productRef.get()).data().stock).toBe(3);
    expect((await coll.doc("ord-1").get()).exists).toBe(true);
    expect((await db.collection("tenants/default/carts").doc("user-1").get()).data().items).toEqual([]);

    // Rollback: nothing committed when the callback throws
    await expect(
      db.runTransaction(async (txn: any) => {
        txn.set(coll.doc("ord-2"), { status: "PENDING" });
        txn.update(productRef, { stock: db.FieldValue.increment(-99) });
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect((await coll.doc("ord-2").get()).exists).toBe(false);
    expect((await productRef.get()).data().stock).toBe(3);
  });

  it("isolates tenant data by collection path", async () => {
    const tenantA = db.collection("tenants/tenant-a/customers");
    const tenantB = db.collection("tenants/tenant-b/customers");

    const refA = await tenantA.add({ telegramUserId: "111" });
    await tenantB.add({ telegramUserId: "111" });

    const docsA = await tenantA.get();
    const docsB = await tenantB.get();
    expect(docsA.docs.length).toBe(1);
    expect(docsB.docs.length).toBe(1);
    expect(docsA.docs[0].id).toBe(refA.id);

    const searchedA = await tenantA.where("telegramUserId", "==", "111").get();
    expect(searchedA.docs.length).toBe(1);
  });
});
