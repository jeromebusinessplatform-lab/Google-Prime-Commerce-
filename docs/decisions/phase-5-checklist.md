# Phase 5 Checklist

This checklist covers runtime verification and deployment readiness after the payment/review flow closure.

## 5.1 Runtime Verification

- [x] Verify server and worker health endpoints return the expected live/ready/dependencies model.
- [x] Validate required runtime variables for server and worker entrypoints.
- [x] Confirm the worker route adapter resolves the current API surface without missing handlers.

## 5.2 Deployment Readiness

- [x] Run the worker smoke path against the current route table.
- [x] Verify build output is consistent for storefront, admin, server, and worker bundles.
- [x] Confirm the deployment scripts still align with the current runtime layout.

## 5.3 Operational Guardrails

- [x] Keep failure modes explicit in health and readiness responses.
- [x] Ensure recovered state from prior phases survives a restart/reload path.
- [x] Keep Phase 5 work from regressing payment/review/queue persistence.
