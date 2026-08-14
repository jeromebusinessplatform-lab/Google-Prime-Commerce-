# Cloudflare Deployment — Prime Commerce

Migration target for the PRIME commerce stack. The system runs on
**Cloudflare Workers + D1** with zero changes to service code:

- **Frontend** (storefront at `/`, admin at `/admin`) — Vite build served from
  Cloudflare Workers Static Assets (`dist/`)
- **API** (`/v1/*`, `/api/*`) — the same Express handlers (`apps/core-service`)
  routed by the Worker (`worker/index.ts` + `worker/router.ts`) through the
  shared route table (`apps/core-service/routes.ts`)
- **Database** — Cloudflare D1 (SQLite). All data access goes through the
  Firestore-like facade in `packages/db`, which is replaced by the D1 adapter
  (`packages/db-d1`) on Cloudflare. No service-layer code changes required.
- **Secrets** — `wrangler secret put` + `[vars]`

## Why the data layer migrates cleanly

Every service module talks to the database through `packages/db/index.ts`,
which exposes a small Firestore-like API:
`collection/doc/add/get/set/update/delete`, `where/orderBy/limit`,
`batch`, `runTransaction`, `FieldValue.increment`.

That facade has two implementations:

| File | Backend | When used |
| --- | --- | --- |
| `packages/db/firestore.ts` | Google Firestore | Local preview (default) |
| `packages/db-d1/index.ts` | Cloudflare D1 / SQLite | `DB_DRIVER=d1`, or the Worker bundle |

The Worker bundle is built with an esbuild alias
(`scripts/build-worker.mjs`) that maps `packages/db` → `packages/db-d1`, so
Firebase never ships to Cloudflare.

### Data layout

One generic table stores all tenant-scoped collections:

```sql
CREATE TABLE documents (
  path TEXT NOT NULL,          -- e.g. 'tenants/default/products'
  id TEXT NOT NULL,            -- document id
  data TEXT NOT NULL,          -- JSON body
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  PRIMARY KEY (path, id)
);
```

Queries use SQLite JSON functions (`json_extract`, `json_each`) so
`where('deletedAt', '==', null)`, `where('items', 'array-contains', ...)`,
and `orderBy('name')` behave like Firestore. `FieldValue.increment` is
applied read-modify-write; `runTransaction` commits writes atomically
(`BEGIN IMMEDIATE` locally, `binding.batch` on D1).

## 1. Prerequisites

- Node 22+ (the repo already pins `@types/node ^22`)
- A Cloudflare account with Workers + D1 enabled
- `wrangler` (already a devDependency) — log in once:

```bash
npm install
npx wrangler login
```

## 2. Create the D1 database

```bash
npx wrangler d1 create prime-db
```

Copy the printed `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "prime-db"
database_id = "REPLACE_WITH_THE_PRINTED_ID"
migrations_dir = "migrations"
```

Apply the schema (`migrations/0001_init.sql`):

```bash
npx wrangler d1 migrations apply prime-db --remote
```

To apply it locally (used by `wrangler dev`):

```bash
npx wrangler d1 migrations apply prime-db --local
```

## 3. Configure secrets and vars

The app requires three signing secrets in production
(fail-fast in `packages/config/env.ts`):

```bash
npx wrangler secret put SESSION_SIGNING_KEY_CURRENT   # openssl rand -hex 32
npx wrangler secret put FIELD_ENCRYPTION_KEY_CURRENT  # openssl rand -hex 32
npx wrangler secret put ADMIN_CODE_PEPPER             # openssl rand -hex 32
```

Optional integrations (only if used):

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put GEOAPIFY_API_KEY
npx wrangler secret put RECEIPT_ANALYZER_API_KEY
npx wrangler secret put PAYMENT_GATEWAY_API_KEY
npx wrangler secret put PAYMENT_GATEWAY_WEBHOOK_SECRET
```

Plain-text vars go in `wrangler.toml`:

```toml
[vars]
# Only needed if you do NOT want preview-mode auto-generated keys
NODE_ENV = "production"
APP_ENV = "production"
```

The Worker copies every string binding (vars + secrets) into `process.env`
before handling requests (`worker/index.ts`), so the shared Node-flavored
service code (`env.ts`, `telegram.ts`, `geoapify.ts`) works unchanged.

> **Heads up**: `process.env` is populated from `[vars]` at build/runtime; if
> a service reads an integration token that you set via
> `wrangler secret put`, the Worker's binding-copy step covers it.

## 4. Build and deploy

### Preview / staging

Use the worker preview URL only for short-lived QA. After the worker is deployed
with `workers_dev = false` and `preview_urls = false`, the public workers.dev
and preview URL paths are no longer published by default.

```bash
npm run deploy:cloudflare
```

This runs, in order:

1. `npm run build` — Vite builds both SPAs into `dist/`, esbuild bundles the
   Node server (for local use)
2. `npm run worker:build` — bundles `worker/index.ts` into
   `dist-worker/index.js` (D1 adapter aliased in, Firebase excluded)
3. `wrangler deploy` — uploads the Worker + static assets, wires the D1
   binding

Dry-run to validate config without deploying:

```bash
npx wrangler deploy --dry-run
```

### Production rollout

Before a live promotion, confirm:

1. `wrangler.toml` still points at the correct remote D1 database ID.
2. `workers_dev = false` and `preview_urls = false` remain set.
3. The required production secrets are present in Cloudflare.
4. The final deploy is triggered from the production branch/build artifact.

If you later add a custom domain or route, add it explicitly in the Wrangler
environment block for production instead of re-enabling workers.dev.

## 5. Local development

### Express + D1 (Node)

```bash
npm run dev:d1        # DB_DRIVER=d1 npm run dev
```

The adapter auto-creates `./data/prime.db` (override with `DB_PATH=:memory:`
or a custom path). Firestore is skipped entirely.

### Worker + D1 (wrangler)

```bash
npm run worker:build
npx wrangler dev
```

`wrangler dev` runs the Worker locally with a local D1 database
(`.wrangler/state`). Note: workerd needs ~1GB+ of address space; if you run
in a constrained container you may need to use the Node harness instead:

```bash
npm run worker:build
npm run worker:smoke   # simulates DB + ASSETS bindings in Node, no workerd
```

## 6. Routing summary

| Path | Handled by |
| --- | --- |
| `/api/*`, `/v1/*` | Worker fetch router → `apps/core-service` handlers |
| `/` + SPA routes | Storefront static assets, fallback to `apps/storefront/src/index.html` |
| `/admin*` | Admin static assets, fallback to `apps/admin/src/index.html` |
| Unknown API path | `404` JSON |

## 7. Migrating existing Firestore data

Export from Firestore (e.g. with `firebase-admin`), then import into D1 by
writing the same document layout:

```sql
INSERT INTO documents (path, id, data, createdAt, updatedAt)
VALUES ('tenants/default/products', ?, ?, ?, ?);
```

`path` = the collection path, `data` = the JSON-serialized document body
(the `id` key inside `data` is optional; the id column is authoritative).
A one-off script is the recommended approach; seed data can also be added as
a migration (`migrations/0002_seed.sql`).

## 8. Notes / limitations

- `orders.ts` only exports `createOrderHandler`; `GET /v1/orders`,
  `GET/PATCH /v1/orders/:id`, and `POST /v1/orders/:id/analyze-receipt`
  return `501`/`404` (same gap as the original Express server — pre-existing).
- `runTransaction` on D1 commits writes with a single `binding.batch` (atomic,
  no interactive transaction); reads inside the callback see committed state.
  Suitable for this workload; use `wrangler d1` console if you need
  point-in-time debugging.
- `storage` is `null` (no object storage migration yet).
