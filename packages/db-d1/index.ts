// D1 / SQLite data adapter.
//
// Drop-in replacement for `packages/db` exposing the same Firestore-like API
// (collection/doc/get/set/update/delete/where/orderBy/limit, batch,
// runTransaction, FieldValue.increment) backed by Cloudflare D1-compatible
// SQL. All data lives in a single generic table:
//
//   documents(path TEXT, id TEXT, data JSON-as-text, createdAt, updatedAt)
//
// `path` is the collection path (e.g. `tenants/default/products`), `id` is
// the document id, and `data` is the JSON-serialized document body.
//
// Driver selection (lazy, resolved on first operation):
//   - `globalThis.__PRIME_D1_BINDING__` -> Cloudflare D1 binding
//   - otherwise                          -> local `node:sqlite` (Node 22+)
//     file at `DB_PATH` (default `./data/prime.db`; `:memory:` for tests)

export interface SqlOp {
  sql: string;
  params?: unknown[];
}

export interface SqlDriver {
  all(sql: string, params?: unknown[]): Promise<Record<string, any>[]>;
  first(sql: string, params?: unknown[]): Promise<Record<string, any> | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
  runAll(ops: SqlOp[]): Promise<void>;
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  path TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  PRIMARY KEY (path, id)
);
CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
`;

const SQL_GET_ROW = "SELECT data, createdAt, updatedAt FROM documents WHERE path = ? AND id = ?";
const SQL_UPSERT = `
  INSERT INTO documents (path, id, data, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(path, id) DO UPDATE SET data = excluded.data, updatedAt = excluded.updatedAt
`;
const SQL_DELETE = "DELETE FROM documents WHERE path = ? AND id = ?";

export interface DocRef {
  path: string;
  id: string;
  collectionPath: string;
}

const INC = Symbol.for("prime.db.increment");

function uuid(): string {
  const g = globalThis as any;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isIncrement(value: any): value is { [INC]: number } {
  return value !== null && typeof value === "object" && typeof value[INC] === "number";
}

function resolveRef(input: any): DocRef {
  if (input && typeof input === "object") {
    if (typeof input.path === "string" && typeof input.id === "string" && typeof input.collectionPath === "string") {
      return { path: input.path, id: input.id, collectionPath: input.collectionPath };
    }
    if (input.ref && typeof input.ref === "object") return resolveRef(input.ref);
  }
  throw new Error("Invalid document reference passed to DB operation");
}

function jsonPath(field: string): string {
  if (!/^[A-Za-z0-9_.$]+$/.test(field)) throw new Error(`Unsafe field name: ${field}`);
  return "$." + field.split(".").join(".");
}

function deepGet(obj: any, path: string): any {
  let cur = obj;
  for (const part of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function deepSet(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (cur[part] == null || typeof cur[part] !== "object") cur[part] = {};
    cur = cur[part];
  }
  cur[parts[parts.length - 1]] = value;
}

function applyPatch(target: any, patch: any) {
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    if (isIncrement(value)) {
      const current = deepGet(target, key);
      deepSet(target, key, (typeof current === "number" ? current : 0) + value[INC]);
    } else {
      deepSet(target, key, value);
    }
  }
}

function stripIncrements(input: any): any {
  if (Array.isArray(input)) return input.map(stripIncrements);
  if (input !== null && typeof input === "object") {
    const out: any = {};
    for (const key of Object.keys(input)) {
      const value = input[key];
      if (!isIncrement(value)) out[key] = stripIncrements(value);
    }
    return out;
  }
  return input;
}

function deepMerge(base: any, patch: any): any {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return patch;
  const out =
    base !== null && typeof base === "object" && !Array.isArray(base) ? { ...base } : {};
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (
      pv !== null &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      out[key] !== null &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], pv);
    } else {
      out[key] = pv;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

function createD1Driver(binding: any): SqlDriver {
  return {
    async all(sql, params = []) {
      const res = await binding.prepare(sql).bind(...params).all();
      return (res.results || []) as Record<string, any>[];
    },
    async first(sql, params = []) {
      return await binding.prepare(sql).bind(...params).first();
    },
    async run(sql, params = []) {
      await binding.prepare(sql).bind(...params).run();
    },
    async runAll(ops) {
      await binding.batch(
        ops.map((op) =>
          op.params?.length ? binding.prepare(op.sql).bind(...op.params) : binding.prepare(op.sql)
        )
      );
    },
  };
}

async function createLocalDriver(dbPath: string): Promise<SqlDriver> {
  const { DatabaseSync } = (await import("node:sqlite")) as any;
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA_SQL);
  const cache = new Map<string, any>();
  const stmt = (sql: string) => {
    let s = cache.get(sql);
    if (!s) {
      s = db.prepare(sql);
      cache.set(sql, s);
    }
    return s;
  };
  return {
    async all(sql, params = []) {
      return stmt(sql).all(...params) as Record<string, any>[];
    },
    async first(sql, params = []) {
      return stmt(sql).get(...params) as Record<string, any> | undefined;
    },
    async run(sql, params = []) {
      stmt(sql).run(...params);
    },
    async runAll(ops) {
      db.exec("BEGIN IMMEDIATE");
      try {
        for (const op of ops) stmt(op.sql).run(...(op.params || []));
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

async function defaultLocalPath(): Promise<string> {
  const nodePath = (await import("node:path")) as any;
  const nodeFs = (await import("node:fs")) as any;
  const p = nodePath.default || nodePath;
  const fs = nodeFs.default || nodeFs;
  const dbPath = p.join((process.cwd && process.cwd()) || ".", "data", "prime.db");
  fs.mkdirSync(p.dirname(dbPath), { recursive: true });
  return dbPath;
}

let cachedDriver: SqlDriver | null = null;

export async function getDriver(): Promise<SqlDriver> {
  if (cachedDriver) return cachedDriver;
  const binding = (globalThis as any).__PRIME_D1_BINDING__;
  if (binding) {
    cachedDriver = createD1Driver(binding);
    return cachedDriver;
  }
  const dbPath =
    typeof process !== "undefined" && process.env?.DB_PATH
      ? process.env.DB_PATH
      : await defaultLocalPath();
  cachedDriver = await createLocalDriver(dbPath);
  return cachedDriver;
}

export function bindD1(binding: any) {
  (globalThis as any).__PRIME_D1_BINDING__ = binding;
  cachedDriver = null;
}

// ---------------------------------------------------------------------------
// Firestore-like facade
// ---------------------------------------------------------------------------

function buildQuerySql(
  collPath: string,
  conditions: Array<{ field: string; op: string; value: any }>,
  orders: Array<{ field: string; direction: "asc" | "desc" }>,
  limitN: number | undefined
): { sql: string; params: unknown[] } {
  const clauses: string[] = ["SELECT id, data FROM documents WHERE path = ?"];
  const params: unknown[] = [collPath];

  for (const c of conditions) {
    const jp = jsonPath(c.field);
    switch (c.op) {
      case "==":
        if (c.value === null) clauses.push(`AND json_extract(data, '${jp}') IS NULL`);
        else {
          clauses.push(`AND json_extract(data, '${jp}') = ?`);
          params.push(c.value);
        }
        break;
      case "!=":
        if (c.value === null) clauses.push(`AND json_extract(data, '${jp}') IS NOT NULL`);
        else {
          clauses.push(`AND json_extract(data, '${jp}') != ?`);
          params.push(c.value);
        }
        break;
      case "<":
      case "<=":
      case ">":
      case ">=":
        clauses.push(`AND json_extract(data, '${jp}') ${c.op} ?`);
        params.push(c.value);
        break;
      case "in":
      case "not-in": {
        const vals = Array.isArray(c.value) ? c.value : [c.value];
        if (vals.length === 0) {
          clauses.push(c.op === "in" ? "AND 0" : "AND 1");
          break;
        }
        clauses.push(
          `AND json_extract(data, '${jp}') ${c.op === "in" ? "IN" : "NOT IN"} (${vals
            .map(() => "?")
            .join(", ")})`
        );
        params.push(...vals);
        break;
      }
      case "array-contains":
        clauses.push(
          `AND EXISTS (SELECT 1 FROM json_each(json_extract(data, '${jp}')) je WHERE je.value = ?)`
        );
        params.push(JSON.stringify(c.value));
        break;
      case "array-contains-any": {
        const vals = Array.isArray(c.value) ? c.value : [c.value];
        if (vals.length === 0) {
          clauses.push("AND 0");
          break;
        }
        clauses.push(
          `AND EXISTS (SELECT 1 FROM json_each(json_extract(data, '${jp}')) je WHERE je.value IN (${vals
            .map(() => "?")
            .join(", ")}))`
        );
        for (const v of vals) params.push(JSON.stringify(v));
        break;
      }
      default:
        throw new Error(`Unsupported query operator: ${c.op}`);
    }
  }

  if (orders.length) {
    clauses.push(
      "ORDER BY " +
        orders
          .map((o) => `json_extract(data, '${jsonPath(o.field)}') ${o.direction === "desc" ? "DESC" : "ASC"}`)
          .join(", ")
    );
  }
  if (limitN !== undefined) {
    clauses.push("LIMIT ?");
    params.push(limitN);
  }
  return { sql: clauses.join(" "), params };
}

class D1Query {
  constructor(
    private client: D1Client,
    private collPath: string,
    private conditions: Array<{ field: string; op: string; value: any }> = [],
    private orders: Array<{ field: string; direction: "asc" | "desc" }> = [],
    private limitN?: number
  ) {}

  where(field: string, op: any, value: any) {
    return new D1Query(this.client, this.collPath, [...this.conditions, { field, op, value }], this.orders, this.limitN);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new D1Query(this.client, this.collPath, this.conditions, [...this.orders, { field, direction }], this.limitN);
  }

  limit(n: number) {
    return new D1Query(this.client, this.collPath, this.conditions, this.orders, n);
  }

  async get() {
    const drv = await this.client.getDriver();
    const { sql, params } = buildQuerySql(this.collPath, this.conditions, this.orders, this.limitN);
    const rows = await drv.all(sql, params);
    const docs = rows.map((r) => ({
      id: r.id as string,
      exists: true,
      data: () => JSON.parse(r.data as string),
      ref: { path: `${this.collPath}/${r.id}`, id: r.id, collectionPath: this.collPath },
    }));
    return { empty: docs.length === 0, docs };
  }
}

class D1Doc {
  readonly id: string;
  readonly path: string;

  constructor(
    private client: D1Client,
    readonly collectionPath: string,
    id: string
  ) {
    this.id = id;
    this.path = `${collectionPath}/${id}`;
  }

  get ref(): DocRef {
    return { path: this.path, id: this.id, collectionPath: this.collectionPath };
  }

  async set(data: any, options?: any) {
    const drv = await this.client.getDriver();
    const now = Date.now();
    const incoming = stripIncrements(data);
    if (options?.merge) {
      const existing = await drv.first(SQL_GET_ROW, [this.collectionPath, this.id]);
      const merged = existing ? deepMerge(JSON.parse(existing.data as string), incoming) : incoming;
      await drv.run(SQL_UPSERT, [
        this.collectionPath,
        this.id,
        JSON.stringify(merged),
        (existing?.createdAt as number) ?? now,
        now,
      ]);
    } else {
      await drv.run(SQL_UPSERT, [this.collectionPath, this.id, JSON.stringify(incoming), now, now]);
    }
    return this;
  }

  async get() {
    const drv = await this.client.getDriver();
    const row = await drv.first(SQL_GET_ROW, [this.collectionPath, this.id]);
    if (!row) return { id: this.id, exists: false, data: () => undefined, ref: this.ref };
    return {
      id: this.id,
      exists: true,
      data: () => JSON.parse(row.data as string),
      ref: this.ref,
    };
  }

  async update(patch: any) {
    const drv = await this.client.getDriver();
    const row = await drv.first(SQL_GET_ROW, [this.collectionPath, this.id]);
    const data = row ? JSON.parse(row.data as string) : {};
    applyPatch(data, patch);
    const now = Date.now();
    await drv.run(SQL_UPSERT, [
      this.collectionPath,
      this.id,
      JSON.stringify(data),
      (row?.createdAt as number) ?? now,
      now,
    ]);
  }

  async delete() {
    const drv = await this.client.getDriver();
    await drv.run(SQL_DELETE, [this.collectionPath, this.id]);
  }
}

class D1Collection {
  constructor(private client: D1Client, readonly collPath: string) {}

  doc(id?: string) {
    return new D1Doc(this.client, this.collPath, id ?? uuid());
  }

  async add(data: any) {
    const docRef = this.doc();
    await docRef.set(data);
    return docRef;
  }

  where(field: string, op: any, value: any) {
    return new D1Query(this.client, this.collPath).where(field, op, value);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new D1Query(this.client, this.collPath).orderBy(field, direction);
  }

  limit(n: number) {
    return new D1Query(this.client, this.collPath).limit(n);
  }

  async get() {
    return new D1Query(this.client, this.collPath).get();
  }
}

class D1Batch {
  private ops: Array<{ kind: "set" | "update" | "delete"; ref: DocRef; data?: any; merge?: boolean }> = [];

  constructor(private client: D1Client) {}

  set(ref: any, data: any, options?: any) {
    this.ops.push({ kind: "set", ref: resolveRef(ref), data, merge: !!options?.merge });
  }

  update(ref: any, patch: any) {
    this.ops.push({ kind: "update", ref: resolveRef(ref), data: patch });
  }

  delete(ref: any) {
    this.ops.push({ kind: "delete", ref: resolveRef(ref) });
  }

  async commit() {
    await this.client.commitWrites(this.ops);
  }
}

class D1Client {
  constructor(private driverLoader: () => Promise<SqlDriver>) {}

  getDriver() {
    return this.driverLoader();
  }

  collection(collPath: string) {
    return new D1Collection(this, collPath);
  }

  get FieldValue() {
    return {
      increment: (n: number) => ({ [INC]: n }),
    };
  }

  batch() {
    return new D1Batch(this);
  }

  async commitWrites(
    writes: Array<{ kind: "set" | "update" | "delete"; ref: DocRef; data?: any; merge?: boolean }>
  ) {
    if (!writes.length) return;
    const drv = await this.getDriver();
    const ops: SqlOp[] = [];
    const now = Date.now();
    for (const w of writes) {
      if (w.kind === "delete") {
        ops.push({ sql: SQL_DELETE, params: [w.ref.collectionPath, w.ref.id] });
        continue;
      }
      const row = await drv.first(SQL_GET_ROW, [w.ref.collectionPath, w.ref.id]);
      let data: any;
      if (w.kind === "set") {
        const incoming = stripIncrements(w.data);
        data = w.merge && row ? deepMerge(JSON.parse(row.data as string), incoming) : incoming;
      } else {
        data = row ? JSON.parse(row.data as string) : {};
        applyPatch(data, w.data);
      }
      ops.push({
        sql: SQL_UPSERT,
        params: [
          w.ref.collectionPath,
          w.ref.id,
          JSON.stringify(data),
          (row?.createdAt as number) ?? now,
          now,
        ],
      });
    }
    await drv.runAll(ops);
  }

  async runTransaction(updateFunction: (txn: any) => Promise<any>) {
    const drv = await this.getDriver();
    const writes: Array<{ kind: "set" | "update" | "delete"; ref: DocRef; data?: any; merge?: boolean }> = [];
    const txn = {
      get: async (ref: any) => {
        const r = resolveRef(ref);
        const row = await drv.first(SQL_GET_ROW, [r.collectionPath, r.id]);
        return row
          ? { exists: true, data: () => JSON.parse(row.data as string) }
          : { exists: false, data: () => undefined };
      },
      set: (ref: any, data: any, options?: any) => {
        writes.push({ kind: "set", ref: resolveRef(ref), data, merge: !!options?.merge });
      },
      update: (ref: any, patch: any) => {
        writes.push({ kind: "update", ref: resolveRef(ref), data: patch });
      },
      delete: (ref: any) => {
        writes.push({ kind: "delete", ref: resolveRef(ref) });
      },
    };
    const result = await updateFunction(txn);
    await this.commitWrites(writes);
    return result;
  }
}

const client = new D1Client(() => getDriver());

export const db = client;
export const storage = null;
export const firestoreDb = null;
