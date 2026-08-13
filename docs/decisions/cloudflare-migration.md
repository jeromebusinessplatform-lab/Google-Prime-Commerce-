# Decision: Migrate to Cloudflare (Workers + D1)

- **Status**: Accepted
- **Date**: 2026-08-13
- **Context**: The stack was originally deployed on Google Cloud (Cloud Run +
  Firestore) but cannot be deployed there: no Google credentials are available
  and the Google deploy path is blocked. The system needs a deployable home.

## Decision

Migrate the whole system to Cloudflare:

- **API**: Cloudflare Workers running the existing Express handlers
  (`apps/core-service/*`) through a minimal fetch router and a shared route
  table (`apps/core-service/routes.ts`).
- **Persistence**: Cloudflare D1 (SQLite). A drop-in adapter
  (`packages/db-d1`) implements the Firestore-like facade that every service
  already uses, so **zero service-layer code changes** are required.
- **Frontend**: Workers Static Assets serves the Vite-built storefront and
  admin SPAs with per-SPA fallbacks.
- **Facade switch**: `packages/db/index.ts` selects Firestore (local preview)
  or D1 (`DB_DRIVER=d1`); the Worker bundle aliases `packages/db` to
  `packages/db-d1` so Firebase never ships to Cloudflare.

## Consequences

- Tests now run hermetically against in-memory D1/SQLite instead of live
  Firestore (the previous `tenant.test.ts` timeout is gone).
- Data layout is a single `documents(path, id, data, createdAt, updatedAt)`
  table with JSON-backed filtering (`json_extract`/`json_each`), preserving
  Firestore query semantics for the operators in use.
- `runTransaction` uses atomic D1 batches; interactive transactions are not
  needed for this workload.
- Google Cloud artifacts (`cloudbuild.yaml`, Firestore rules, `DEPLOYMENT.md`
  legacy section) are kept for reference/rollback only.
- Deployment to Cloudflare still requires a **full** `CLOUDFLARE_API_TOKEN`;
  the token previously supplied in `PRIMEStackKeys.txt` is truncated.
