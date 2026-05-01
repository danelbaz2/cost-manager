# Build Plan

Step-by-step plan for delivering the project end-to-end. Each step produces
something runnable so we never sit on a half-finished base.

## Phase 0 — Repository scaffolding

1. Create the folder layout described in `README.md`.
2. Add `package.json` at the root with **npm workspaces** so that
   `shared/`, `services/users`, `services/costs`, `services/logs`,
   `services/about`, and `tests/` are individual workspaces sharing a single
   `node_modules`. This keeps the ZIP small and avoids dependency drift.
3. Add `.env.example`, `.gitignore`, `.editorconfig`.
4. Add root scripts:
   - `npm run dev:<service>` — start one process with nodemon
   - `npm start`             — start all four processes (concurrently) for
                              local testing
   - `npm test`              — run the test suite

## Phase 1 — Shared layer (`shared/`)

1. **`env.js`** — load `.env`, validate required keys
   (`MONGO_URI`, `PORT_USERS`, `PORT_COSTS`, `PORT_LOGS`, `PORT_ABOUT`,
   `TEAM_MEMBERS`).
2. **`db.js`** — Mongoose `connect()` helper that retries on failure.
3. **`models/`** — see `DATA_MODEL.md`:
   - `users.js`   — User schema (`id`, `first_name`, `last_name`, `birthday`)
   - `costs.js`   — Cost schema (`description`, `category`, `userid`, `sum`,
                    `date`)
   - `logs.js`    — Log schema (request log entries)
   - `reports.js` — Computed monthly report cache (see `COMPUTED_PATTERN.md`)
4. **`logger.js`** — Pino logger configured with a custom transport that
   writes each entry to the `logs` collection. Also exports an Express
   middleware that logs every incoming request and a helper to log endpoint
   access events.

## Phase 2 — Services

Each service uses the same skeleton:

```js
// services/<name>/index.js
require('../../shared/env');
const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger } = require('../../shared/logger');

const app = express();
app.use(express.json());
app.use(httpLogger);                   // request logs → MongoDB
app.use('/api', require('./routes'));  // service-specific routes
app.use(errorHandler);                 // returns { id, message }

connect().then(() => app.listen(PORT));
```

### 2.1 Users service (port 3001)
- `POST /api/add` — create user
- `GET  /api/users` — list users
- `GET  /api/users/:id` — single user with `total` cost
  - `total` is computed via Mongoose aggregation on the `costs` collection
    (`$match: { userid }`, `$group: { _id: null, total: { $sum: '$sum' } }`)

### 2.2 Costs service (port 3002)
- `POST /api/add` — create cost item
  - Reject if `date` is in the past (per spec: "doesn't allow adding costs
    with dates that belong to the past"). If the client doesn't send `date`,
    the server uses `Date.now()`.
  - Validate `category` ∈ {food, health, housing, sports, education}.
  - Validate that `userid` exists.
- `GET /api/report?id=&year=&month=` — monthly report, computed-pattern
  cached. See `COMPUTED_PATTERN.md`.

### 2.3 Logs service (port 3003)
- `GET /api/logs` — return all log documents (paginated query is fine).

### 2.4 About service (port 3004)
- `GET /api/about` — return `[{ first_name, last_name }, ...]` from
  `process.env.TEAM_MEMBERS` (JSON string) or a hardcoded constant. **No DB.**

## Phase 3 — Error handling

- Single Express error middleware in each service.
- Error responses always include `{ id, message }`. `id` is a short
  machine-readable code (e.g. `"validation_error"`), `message` is a
  human-readable description.

## Phase 4 — Tests (`tests/`)

Use **Jest** + **supertest**. For each endpoint:
- Happy path
- Validation errors
- Not-found / edge cases
- Computed-pattern test: request the same past month twice and assert that
  the second call hits the cache (e.g. mark via a spy on the aggregation,
  or by reading the `reports` collection between calls).

A test helper spins up an in-memory Mongo (`mongodb-memory-server`) so the
suite is self-contained.

## Phase 5 — Code style & docs

- Add JSDoc comments to every exported function.
- Run `eslint` with a config aligned to the *Professional JavaScript Style
  Guide* book (semicolons, single quotes, strict equality, no unused vars,
  meaningful names).
- Each module begins with a short banner comment describing its purpose.

## Phase 6 — Deployment

See `DEPLOYMENT.md`. Target Render / Railway / Fly.io free tier — one
service per deployment. Fill in the submission form with the four URLs.

## Phase 7 — Submission package

- 60-second unlisted YouTube demo
- PDF with all source code, team info, video link, collaboration-tools
  summary
- ZIP of the project (no `node_modules`)
- Final database state: empty except for one user
  `{ id: 123123, first_name: "mosh", last_name: "israeli" }`.
