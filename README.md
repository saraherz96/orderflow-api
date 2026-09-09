# OrderFlow API

A small TypeScript order management API used to demonstrate
incident reproduction and patch verification with Signal Patch.

## Stack

- Node.js
- TypeScript
- Express
- Vitest

## Getting started

```bash
npm ci
npm run dev
```

The API runs at http://localhost:3001.

In a second terminal, start the React/Vite console:

```bash
npm run dev:ui
```

Open http://localhost:5173/ to create an order, record a deposit, confirm it,
and inspect the real API responses in the activity history. The confirmation
button remains available with a zero deposit so the backend validation can be
reproduced from the screen.

## Verification

```bash
npm run typecheck
npm test
npm run build:ui
```

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /health | Check API health |
| POST | /orders | Create an order with a total |
| GET | /orders/:id | Retrieve an order |
| POST | /orders/:id/deposit | Set the recorded deposit amount |
| POST | /orders/:id/confirm | Confirm an order |

## Demo branches

- `main`: working implementation; all four regression tests pass.
- `demo/missing-deposit-validation`: intentional validation defect;
  three regression tests fail and one passes.

The incident description is available in `examples/incident.md`.

## Limitations

Data is stored in memory and resets when the server restarts.
This demo does not process payments or provide authentication.
It is intended for local development and controlled demonstrations.