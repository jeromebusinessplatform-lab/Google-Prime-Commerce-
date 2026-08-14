# Directive Gap Checklist

This checklist maps the current `Google-Prime-Commerce` workspace against the master directive.

## Done

- Separate storefront, admin, and core-service apps exist.
- Cloudflare deployment path exists with `worker/index.ts` and `wrangler.toml`.
- Telegram auth, admin bootstrap login, cart, checkout, courier, geo, orders, and queue domains are implemented.
- D1 / Firestore adapters, shared domain packages, and tests exist.

## Partial

- Health reporting exists, but it only exposes a shallow `ok` signal today.
- Telegram initData validation exists, but startup validation is not centralized.
- Build-status docs exist, but they still describe the older greenfield plan and need to be reconciled with this workspace.
- UI styling already reflects the Prime reference, but it still needs a final fidelity pass and responsive validation.

## Missing

- Startup fail-fast validation with clear, service-specific missing-variable reporting.
- Separate `live`, `ready`, and `dependencies` health semantics for worker and API entrypoints.
- Heartbeat and stale-status modeling for background work.
- A formal phase-by-phase recovery log for the current workspace.
- End-to-end verification that messaging, order ingestion, and worker readiness are operational, not just compiled.
- A full runtime check for every required production variable in the Cloudflare path.

## Next Work

1. Add runtime validation and readiness endpoints.
2. Align build-status docs with the current workspace.
3. Run targeted tests for auth, webhook, queue, orders, and health behavior.
