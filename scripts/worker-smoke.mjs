// Local end-to-end smoke test for the Cloudflare Worker bundle.
//
// Runs the built worker (dist-worker/index.js) in Node with a fake D1 binding
// backed by an in-memory store and a fake ASSETS binding backed by dist/.
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

if (typeof globalThis.require !== "function") {
  const { createRequire } = await import("node:module");
  globalThis.require = createRequire(import.meta.url);
}

const fakeD1 = (() => {
  const store = new Map();
  const readDoc = (path, id) => store.get(path)?.get(id);
  const listDocs = (path) => [...(store.get(path)?.entries() || [])].map(([id, data]) => ({ id, data }));
  const writeDoc = (path, id, data) => {
    if (!store.has(path)) store.set(path, new Map());
    store.get(path).set(id, JSON.parse(JSON.stringify(data)));
  };
  const normalizeParams = (params) => (Array.isArray(params) ? params : Object.values(params || {}));
  const matchQuery = (sql, params) => {
    const values = normalizeParams(params);
    const normalized = String(sql).toLowerCase();
    if (normalized.includes("from documents where path = ? and id = ?")) {
      const [path, id] = values;
      const row = readDoc(String(path), String(id));
      return row ? [{ id: String(id), data: JSON.stringify(row), createdAt: Date.now(), updatedAt: Date.now() }] : [];
    }
    if (normalized.includes("from documents where path = ?")) {
      const [path] = values;
      let docs = listDocs(String(path));
      if (normalized.includes("json_extract(data, '$.deletedAt') is null")) docs = docs.filter((doc) => doc.data?.deletedAt == null);
      return docs.map((doc) => ({ id: doc.id, data: JSON.stringify(doc.data), createdAt: Date.now(), updatedAt: Date.now() }));
    }
    return [];
  };
  return {
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async all() { return { results: matchQuery(sql, params) }; },
            async first() { return matchQuery(sql, params)[0]; },
            async run() {
              const normalized = String(sql).toLowerCase();
              if (normalized.includes("insert into documents") || normalized.includes("on conflict(path, id) do update")) {
                const [path, id, data] = normalizeParams(params);
                writeDoc(String(path), String(id), JSON.parse(String(data)));
              }
              if (normalized.includes("delete from documents")) {
                const [path, id] = normalizeParams(params);
                store.get(String(path))?.delete(String(id));
              }
              return { success: true };
            },
          };
        },
      };
    },
    async batch(statements) {
      for (const statement of statements) {
        const sql = String(statement.__sql || "").toLowerCase();
        const params = statement.__params || [];
        if (sql.includes("insert into documents") || sql.includes("on conflict(path, id) do update")) {
          const [path, id, data] = normalizeParams(params);
          writeDoc(String(path), String(id), JSON.parse(String(data)));
        }
        if (sql.includes("delete from documents")) {
          const [path, id] = normalizeParams(params);
          store.get(String(path))?.delete(String(id));
        }
      }
    },
  };
})();

const distDir = path.resolve(root, "dist");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".ico": "image/x-icon", ".json": "application/json",
};
const fakeAssets = {
  async fetch(request) {
    const url = request instanceof Request ? new URL(request.url) : new URL(request);
    const rel = url.pathname === "/" ? "/index.html" : url.pathname === "/admin" ? "/admin/index.html" : url.pathname;
    try {
      const content = await fs.readFile(path.join(distDir, rel));
      const ext = path.extname(rel);
      return new Response(content, { status: 200, headers: { "content-type": MIME[ext] || "application/octet-stream" } });
    } catch {
      return new Response("not found", { status: 404 });
    }
  },
};

const { default: worker } = await import(path.join(root, "dist-worker/index.js"));
const results = [];
async function call(name, req, check) {
  const res = await worker.fetch(req, { DB: fakeD1, ASSETS: fakeAssets });
  const text = await res.text();
  const ok = check(res.status, text);
  results.push({ name, ok, status: res.status, body: text.slice(0, 120) });
}

await call("GET /api/health", new Request("http://localhost/api/health"), (status) => status === 200);
await call("POST /v1/catalog/products", new Request("http://localhost/v1/catalog/products", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Smoke Milk", price: 3.5, stock: 7 }),
}), (status, text) => status === 200 && JSON.parse(text).data?.name === "Smoke Milk");
await call("GET /v1/catalog", new Request("http://localhost/v1/catalog"), (status, text) => status === 200 && JSON.parse(text).data?.length === 1);
await call("GET /v1/catalog/products/missing-id", new Request("http://localhost/v1/catalog/products/missing-id"), (status) => status === 404);
await call("GET / storefront HTML", new Request("http://localhost/"), (status, text) => status === 200 && text.toLowerCase().includes("<!doctype html>"));
await call("GET /admin admin HTML", new Request("http://localhost/admin"), (status, text) => status === 200 && text.toLowerCase().includes("<!doctype html>"));
await call("GET /v1/unknown 404", new Request("http://localhost/v1/unknown"), (status) => status === 404);

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name} -> ${r.status}`);
  if (!r.ok) { failed++; console.log("       body:", r.body); }
}
console.log(failed ? `\n${failed} smoke checks failed` : "\nAll worker smoke checks passed");
process.exit(failed ? 1 : 0);
