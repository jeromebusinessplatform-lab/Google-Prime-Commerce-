# Phase 4 Checklist

This checklist is the working execution plan for the remaining payment, proof,
and review work.

## 4.1 Payment Drafts

- [ ] Persist a payment draft for every checkout session before order creation.
- [ ] Bind each draft to the immutable quote, selected payment method, and customer.
- [ ] Store the draft status separately from order status.
- [ ] Add recovery for abandoned drafts with a stable lookup key.

## 4.2 Proof Upload

- [ ] Support admin-uploaded proof assets with version history.
- [ ] Support customer-uploaded proof assets tied to the same draft.
- [ ] Store proof metadata separately from payment state.
- [ ] Reject unsafe or malformed proof input before persistence.

## 4.3 Receipt Review

- [ ] Run deterministic receipt analysis through a single review contract.
- [ ] Preserve the analysis verdict as `VALIDATED` or `UNVALIDATED`.
- [ ] Keep analyzer failures from blocking review submission.
- [ ] Separate analyzer verdict from gateway settlement status.

## 4.4 Review Queue

- [ ] Surface all payment-review items in an Admin review queue.
- [ ] Allow explicit approve, reject, and needs-review actions.
- [ ] Persist the reviewer, timestamp, and reason for every action.
- [ ] Ensure the queue can resume from existing persisted state.

## 4.5 Delivery Status

- [ ] Maintain queue-entry, ready, dispatched, and delivered timestamps.
- [ ] Compute queue summary from stored state, not from UI assumptions.
- [ ] Keep stale, missing, and active states distinct.

## 4.6 Confirmation

- [ ] Generate order numbers from tenant time zone using `DDMMYYHHMMSS`.
- [ ] Resolve same-second collisions deterministically with a suffix.
- [ ] Persist a confirmation snapshot for the final submit action.
- [ ] Provide a reduced-motion-safe confirmation path.

## 4.7 Admin Evidence

- [ ] Add an evidence viewer with zoom, pan, rotate, and fullscreen.
- [ ] Show review state, settlement state, and proof state together.
- [ ] Expose copyable reference fields without leaking unrelated PII.

## 4.8 Done Criteria

- [ ] Payment draft, proof, review, and queue states survive reload.
- [ ] Validation covers success, failure, and recovery paths.
- [ ] Admin can resolve a payment-review item end to end.
- [ ] Orders continue into Phase 5 without blocking on proof review.
