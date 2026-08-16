# Launch Gate

Production target: Cloudflare Workers + D1.

The Shopfront (`/`) and Admin (`/admin`) are not launch-ready until the Worker build and critical order lifecycle smoke checks pass against the intended D1 database.

Critical paths: catalog, checkout/order creation, inventory decrement/idempotency, order retrieval/detail/update, payment review, fulfillment transitions, customer order detail, and Admin Order Management.

A successful Cloudflare deploy alone is not sufficient evidence of readiness.
