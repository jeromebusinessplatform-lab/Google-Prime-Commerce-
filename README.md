# Enterprise Commerce Boilerplate

A modular, multi-tenant capable, event-driven enterprise commerce monorepo architecture built with Node.js, Express, React (Vite), and Tailwind CSS.

## Architecture Highlights
- **Domain-Driven Design (DDD)**: Core business logic isolated in `packages/domain` with pure functions.
- **Multi-Tenant Foundation**: Services are designed to support tenant contexts routing via request headers/paths.
- **Audit Trails**: Cryptographically linked sequence hashes for critical state changes (`audit_events`).
- **Portable Data Facade**: All persistence flows through `packages/db` (Firestore-like API). A D1/SQLite adapter (`packages/db-d1`) provides the Cloudflare backend; the Google Firestore facade remains for local preview.
- **App Segregation**: 
  - `apps/storefront` for consumer-facing shopping.
  - `apps/admin` for fulfillment, catalog, and dashboard operations.
  - `apps/core-service` for backend API routing.
- **Cloudflare-ready**: Workers entry (`worker/`) + D1 migrations + static-asset hosting. See `DEPLOYMENT-CLOUDFLARE.md`.

## Run Locally
1. Install dependencies: `npm install`
2. Start server: `npm run dev` (Runs concurrently: Vite for both apps + Express server).
3. Run against the Cloudflare D1/SQLite backend instead of Firestore: `npm run dev:d1`

## Available Endpoints
- `GET /v1/catalog` - Get product list
- `GET /v1/catalog/products/:id` - Get product details
- `GET /v1/order-queue/summary` - Wait time calculation for queues
- `POST /v1/checkout/sessions` - Create secure payment session
- `POST /v1/webhooks/telegram/:botKey` - Telegram Mini App Webhooks

## Tech Stack
- TypeScript
- React 18, Vite
- Express.js
- Tailwind CSS (v4)
- Vitest for Unit testing domain rules
- Cloudflare Workers + D1 (production), Firebase SDK (legacy/preview backend)

## Cloudflare Migration
The system has been migrated to run entirely on Cloudflare: **Workers** for
the API, **Workers Static Assets** for the storefront/admin SPAs, and **D1**
(SQLite) for persistence. Service code is unchanged because every module uses
the `packages/db` facade, which is swapped to the D1 adapter in the Worker
bundle. See [`DEPLOYMENT-CLOUDFLARE.md`](DEPLOYMENT-CLOUDFLARE.md) for the
full setup and deployment guide.
