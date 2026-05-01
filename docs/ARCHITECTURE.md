# Architecture

## Why four processes?

The spec is explicit:

> "Developing one project with four routes (each route handling a separate
> collection of endpoints) won't be a fulfillment of the requirement for
> separate processes."

So we need **four OS processes**, each listening on its own port. We use a
**monorepo with shared modules** rather than four cloned repos, so that the
Mongoose schemas, the logger, and the env helper are written once and reused.
This satisfies the "separate processes" rule (each service has its own
`index.js`, its own port, and is deployed independently) while keeping the
codebase reviewable in one PDF.

```
            ┌──────────────────────┐
            │   MongoDB Atlas      │
            │  users / costs /     │
            │   logs / reports     │
            └─────────▲────────────┘
                      │
   ┌───────────┬──────┴──────┬─────────────┐
   │           │             │             │
┌──┴───┐  ┌────┴───┐    ┌────┴───┐    ┌────┴───┐
│users │  │ costs  │    │  logs  │    │ about  │
│:3001 │  │ :3002  │    │ :3003  │    │ :3004  │
└──────┘  └────────┘    └────────┘    └────────┘
   │           │             │             │
   └───────────┴── shared/ ──┴─────────────┘
       (models, logger, db.js, env.js)
```

## Process responsibilities

| Service | Owns endpoints | Touches collections |
| --- | --- | --- |
| **users**  | `POST /api/add` (user), `GET /api/users`, `GET /api/users/:id` | `users` (read/write), `costs` (read for `total`) |
| **costs**  | `POST /api/add` (cost), `GET /api/report` | `costs` (read/write), `users` (read for validation), `reports` (read/write — computed cache) |
| **logs**   | `GET /api/logs` | `logs` (read) |
| **about**  | `GET /api/about` | none |

Both `users` and `costs` accept `POST /api/add`, but they're **different
processes on different ports**, so there is no route collision.

## Cross-cutting concerns

- **Logging.** Every service mounts the same Pino-based middleware from
  `shared/logger.js`. Every request and every endpoint hit lands in the
  `logs` collection. The `logs` service then reads back from that
  collection.
- **Configuration.** A single `.env` at the repo root holds all variables.
  Each service loads it through `shared/env.js`.
- **DB connection.** Each process opens its own Mongoose connection via
  `shared/db.js`. The `about` service skips this — it has no DB needs.

## Deployment shape

In production, each service is a separate deployment (Render web service,
Fly.io app, etc.) with its own URL. Locally we either run them one at a
time (`npm run dev:users`) or all four concurrently for full integration
testing.

## Why this satisfies the rubric

- ✅ Four processes — four `index.js` files, four ports, four deploy
  targets.
- ✅ MongoDB + Mongoose — shared models folder.
- ✅ Pino — shared logger writing to Mongo.
- ✅ Computed pattern — implemented in the costs service, see
  `COMPUTED_PATTERN.md`.
- ✅ `.env` — single source of truth for config.
- ✅ Models in a folder named `models` — `shared/models/`.
