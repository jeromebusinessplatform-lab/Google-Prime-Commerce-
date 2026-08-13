// Local end-to-end smoke test for the Cloudflare Worker bundle.
//
// Runs the built worker (dist-worker/index.js) in Node with a fake D1 binding
// backed by in-memory SQLite (node:sqlite) and a fake ASSETS binding backed by
// the local dist/ directory. Useful when `wrangler dev` is unavailable
// (e.g. sandboxed environments). Requires `npm run worker:build` first.
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// The built bundle relies on esbuild's `__require` shim for external Node
// builtins. In Node ESM there is no global `require`, so provide one via
// createRequire (workerd supplies its own `require` under nodejs_compat).
if (typeof globalThis.require !== "function") {
  const { createRequire } = await import("node:module");
  globalThis.require = createRequire(import.meta.url);
}

// --- In-memory SQLite driver implementing the D1 binding surface -----------
const { DatabaseSync } = await import("node:sqlite");
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    path TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    PRIMARY KEY (path, id)
  );
  CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
`);
const cache = new Map();
const stmt = (sql) => {
  let s = cache.get(sql);
  if (!s) {
    s = sqlite.prepare(sql);
    cache.set(sql, s);
  }
  return s;
};

const fakeD1 = {
  prepare(sql) {
    return {
      bind(...params) {
        return {
          __sql: sql,
          __params: params,
          async all() {
            return { results: stmt(sql).all(...params) };
          },
          async first() {
            return stmt(sql).get(...params);
          },
          async run() {
            return stmt(sql).run(...params);
          },
        };
      },
    };
  },
  async batch(statements) {
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      for (const s of statements) stmt(s.__sql).run(...(s.__params || []));
      sqlite.exec("COMMIT");
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  },
};

// --- Fake ASSETS binding serving the Vite build output ---------------------
const distDir = path.resolve(root, "dist");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
};
const fakeAssets = {
  async fetch(request) {
    const url = request instanceof Request ? new URL(request.url) : new URL(request);
    const rel = url.pathname === "/" ? "/apps/storefront/src/index.html" : url.pathname;
    try {
      const content = await fs.readFile(path.join(distDir, rel));
      const ext = path.extname(rel);
      return new Response(content, {
        status: 200,
        headers: { "content-type": MIME[ext] || "application/octet-stream" },
      });
    } catch {
      return new Response("not found", { status: 404 });
    }
  },
};

// --- Run the worker ---------------------------------------------------------
const { default: worker } = await import(path.join(root, "dist-worker/index.js"));

const results = [];
async function call(name, req, check) {
  const res = await worker.fetch(req, { DB: fakeD1, ASSETS: fakeAssets });
  const text = await res.text();
  const ok = check(res.status, text);
  results.push({ name, ok, status: res.status, body: text.slice(0, 120) });
}

await call(
  "GET /api/health",
  new Request("http://localhost/api/health"),
  (status) => status === 200
);

await call(
  "POST /v1/catalog/products",
  new Request("http://localhost/v1/catalog/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Smoke Milk", price: 3.5, stock: 7 }),
  }),
  (status, text) => status === 200 && JSON.parse(text).data?.name === "Smoke Milk"
);

await call(
  "GET /v1/catalog",
  new Request("http://localhost/v1/catalog"),
  (status, text) => status === 200 && JSON.parse(text).data?.length === 1
);

await call(
  "GET /v1/catalog/products/missing-id",
  new Request("http://localhost/v1/catalog/products/missing-id"),
  (status) => status === 404
);

await call(
  "GET / storefront HTML",
  new Request("http://localhost/"),
  (status, text) => status === 200 && text.toLowerCase().includes("<!doctype html>")
);

await call(
  "GET /admin admin HTML",
  new Request("http://localhost/admin"),
  (status, text) => status === 200 && text.toLowerCase().includes("<!doctype html>")
);

await call(
  "GET /v1/unknown 404",
  new Request("http://localhost/v1/unknown"),
  (status) => status === 404
);

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name} -> ${r.status}`);
  if (!r.ok) {
    failed++;
    console.log("       body:", r.body);
  }
}
console.log(failed ? `\n${failed} smoke checks failed` : "\nAll worker smoke checks passed");
process.exit(failed ? 1 : 0);
