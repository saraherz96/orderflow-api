# Incident: order confirmation

## Symptom

A client can submit the confirmation request more than once when a network timeout makes the first response ambiguous. The operation must not create a second state transition or produce a different confirmation timestamp.

## Expected behavior

`POST /orders/:orderId/confirm` should:

- return `404` when the order does not exist;
- transition a pending order to `confirmed`;
- set `confirmedAt` once;
- return the same confirmed order for repeated requests.

## Verification

Run:

```bash
npm test
npm run typecheck
```

The test in `tests/confirm-order.test.ts` covers the transition, timestamp, and idempotent retry behavior.
