# Enterprise Commerce Boilerplate

A modular, multi-tenant capable, event-driven enterprise commerce monorepo architecture built with Node.js, Express, React (Vite), and Tailwind CSS.

## Architecture Highlights
- **Domain-Driven Design (DDD)**: Core business logic isolated in `packages/domain` with pure functions.
- **Multi-Tenant Foundation**: Services are designed to support tenant contexts routing via request headers/paths.
- **Audit Trails**: Cryptographically linked sequence hashes for critical state changes (`audit_events`).
- **Preview Mode**: Clean in-memory mock engine `MockFirestore` to allow previewing the app visually without actual Google Cloud or Firebase credentials initially.
- **App Segregation**: 
  - `apps/storefront` for consumer-facing shopping.
  - `apps/admin` for fulfillment, catalog, and dashboard operations.
  - `apps/core-service` for backend API routing.

## Run Locally
1. Install dependencies: `npm install`
2. Start server: `npm run dev` (Runs concurrently: Vite for both apps + Express server).

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
- Firebase Admin SDK (used for durable backend mode)
