# Cost Manager — Build Plan

Consolidated plan for the Asynchronous Server-Side Development final project.
Companion docs: [ARCHITECTURE.md](ARCHITECTURE.md), [API.md](API.md),
[DATA_MODEL.md](DATA_MODEL.md), [COMPUTED_PATTERN.md](COMPUTED_PATTERN.md),
[DEPLOYMENT.md](DEPLOYMENT.md),
[REQUIREMENTS_CHECKLIST.md](REQUIREMENTS_CHECKLIST.md),
[REJECTS.md](REJECTS.md).

## Confirmed choices

- **Test stack:** Jest + supertest + `mongodb-memory-server`
- **Deploy target:** Render.com free tier (one Web Service per process)
- **Code structure:** monorepo with npm workspaces + a `shared/` folder
- **User-exists check** (cost add): direct DB read against `users`
  collection (Q12 says a dedicated endpoint is also acceptable; we don't
  need one)
- **Past-date rejection (strict):** `addCost` rejects any `date < Date.now()`
- **Duplicate user id on `POST /api/add` (user):** rejected (HTTP 409,
  `{ id: "conflict", message: "user id already exists" }`)
- **Seed user birthday:** `1990-01-01T00:00:00.000Z`

## 1. The big picture

The spec demands **four independent OS processes**, not four routes in one
app — that's the single most architecture-shaping requirement (spec
explicitly + Q14: "one project with 4 routes is NOT a fulfillment").
Everything else (MongoDB, Mongoose, Pino, Express, Computed pattern,
`.env`, `models/` folder) sits inside that constraint.

Approach: **monorepo with npm workspaces.** One repo, shared
models/logger/env, four `index.js` entry points each on its own port.
Avoids four cloned repos with drift, but each service is still a real
separate process when run and when deployed.

## 2. Repository layout

```
cost-manager/
├── shared/
│   ├── models/                # spec requires a folder named EXACTLY `models`
│   │   ├── users.js           # Mongoose schema for `users`
│   │   ├── costs.js           # Mongoose schema for `costs`
│   │   ├── logs.js            # Mongoose schema for `logs`
│   │   └── reports.js         # Mongoose schema for `reports` (computed cache)
│   ├── db.js                  # mongoose.connect helper
│   ├── env.js                 # dotenv load + required-key validation
│   ├── logger.js              # Pino + Mongo transport + Express middleware
│   └── validation.js          # tiny per-endpoint validators (Q1: validate everything)
├── services/
│   ├── users/index.js         # process 1 → port 3001 (b in test code)
│   ├── costs/index.js         # process 2 → port 3002 (c in test code)
│   ├── logs/index.js          # process 3 → port 3003 (a in test code)
│   └── about/index.js         # process 4 → port 3004 (d in test code)
├── tests/                     # Jest + supertest
├── scripts/seed.js            # inserts the single `mosh israeli` user
├── .env.example
├── .gitignore
├── package.json               # workspaces root + dev/start scripts
└── docs/                      # planning docs
```

> Each service folder also gets a tiny `models/` re-export folder
> (`require('../../shared/models/...')`) so that the **physical folder
> named `models`** is present alongside every service's code, satisfying
> Q2 unambiguously even when graders open just one service folder.

## 3. The four processes

Mapping matches the test program's `a`/`b`/`c`/`d` variables:

| Letter | Service   | Port | Endpoints                                              | Collections touched                                        |
|--------|-----------|------|--------------------------------------------------------|------------------------------------------------------------|
| **a**  | **logs**  | 3003 | `GET /api/logs`                                        | `logs` (read)                                              |
| **b**  | **users** | 3001 | `POST /api/add`, `GET /api/users`, `GET /api/users/:id`| `users` (rw), `costs` (read for `total`)                   |
| **c**  | **costs** | 3002 | `POST /api/add`, `GET /api/report`                     | `costs` (rw), `users` (read to validate `userid`), `reports` (rw — cache) |
| **d**  | **about** | 3004 | `GET /api/about`                                       | none — reads from `.env`                                   |

Both `users` and `costs` define `POST /api/add` — fine because they're on
different ports/processes.

The grader's test code calls these URLs with **trailing slashes**
(`/api/about/`, `/api/add/`, `/api/report/`). We will leave Express's
default routing on (no `strict routing`) so both forms work.

## 4. Data model (Mongoose) — see [DATA_MODEL.md](DATA_MODEL.md)

- **users** — `id: Number (unique)`, `first_name: String`, `last_name: String`, `birthday: Date`
  - Spec: `id` and `_id` are different — never mix them.
- **costs** — `description: String`, `category: String (enum)`, `userid: Number`, `sum: Double`, `date: Date (default now)`
  - `Double` is required by the spec → `mongoose.Schema.Types.Double`.
- **logs** — `level`, `time`, `msg`, `method`, `url`, `status`, `durationMs`, `meta` (Pino entries; same property names as the response shape)
- **reports** (computed cache) — `userid`, `year`, `month`, `payload: Object`, unique index on `(userid, year, month)`

Categories enum (all 5 — sports is easy to forget): `food, health, housing, sports, education`.

## 5. Validation rules (Q1: "validate ALL data reaching every endpoint")

A single tiny `shared/validation.js` exports per-endpoint validators
returning `{ ok: true, value }` or `{ ok: false, id, message }`.

| Endpoint                | Required / checks                                                                                                          |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `POST /api/add` (user)  | `id` Number, `first_name` non-empty String, `last_name` non-empty String, `birthday` parseable Date. Reject duplicate `id`. |
| `GET /api/users/:id`    | `:id` parseable as Number. 404 if user not found.                                                                           |
| `POST /api/add` (cost)  | `description` String, `category` ∈ enum, `userid` Number existing in `users`, `sum` finite Number > 0. `date` (optional): parseable Date, **rejected if in the past** (see §6.2). |
| `GET /api/report`       | `id` Number, `year` Number, `month` Number ∈ 1..12.                                                                        |
| `GET /api/users`        | none                                                                                                                       |
| `GET /api/logs`         | none                                                                                                                       |
| `GET /api/about`        | none                                                                                                                       |

Validation failures → HTTP 400 + `{ id: "validation_error", message: "..." }`.

## 6. Key functions / responsibilities

### 6.1 `shared/`
- `env.js` → `loadEnv()` validates `MONGO_URI`, `PORT_*`, `TEAM_MEMBERS`
- `db.js` → `connect()` — mongoose connect with retry
- `logger.js` → `logger` (Pino instance), `httpLogger` (Express middleware
  writing each request to `logs` — see §7), `logEndpoint(name, meta)`
  helper for the per-endpoint log event
- `validation.js` → `validateAddUser`, `validateAddCost`,
  `validateReportQuery`, `validateUserId`

### 6.2 `services/users/`
- `addUser(req)` — validate, insert, return doc (omit `_id` and `__v`)
- `listUsers()` — `User.find()` (omit `_id`/`__v`)
- `getUser(id)` — find user; aggregate `costs` for
  `total = $sum: '$sum'`; return `{ first_name, last_name, id, total }`

### 6.3 `services/costs/`
- `addCost(req)` — validate; verify `userid` exists in `users` collection;
  if `date` provided, **reject if it's earlier than `Date.now()`**
  (`{ id: "past_date_not_allowed", message: ... }`); insert; return saved doc.
- `getReport(userid, year, month)` — implements the computed pattern:
  - **(year, month) is current month or future** → recompute every time
    (Q7 says current/future month reports must work; cannot cache because
    new costs may still arrive).
  - **(year, month) is in the past** → `findOneAndUpdate({userid, year, month}, {$setOnInsert:{payload}}, {upsert:true})`. Return cached
    `payload` if present, otherwise compute, store, return.
- `computeReport()` — single Mongoose aggregation: `$match` by `userid` +
  `date` range covering the month → `$project` with
  `day = $dayOfMonth: $date` → `$group` by `category` → reshape to spec
  JSON: `costs` is an **array of single-key objects**, one per category
  in the enum, each holding the array of `{ sum, description, day }`.
  Every category present even when empty (sample JSON + Q15 confirm).

### 6.4 `services/logs/`
- `listLogs()` → `Log.find()`. Property names match the schema 1:1 so the
  reply shape == the collection doc shape (spec requirement).

### 6.5 `services/about/`
- `getAbout()` → returns `JSON.parse(process.env.TEAM_MEMBERS)` — array
  of `{ first_name, last_name }` only. **No DB call.** **Only** these
  two properties — nothing else (spec is explicit).

### 6.6 Cross-cutting
- `errorHandler` middleware → response always `{ id, message }`.
  Codes used: `validation_error`, `not_found`, `conflict`,
  `past_date_not_allowed`, `internal_error`.

## 7. Logging requirements (spec: TWO log events)

> "Log message should be written to the database for every HTTP request
> the server-side receives **and, in addition, whenever an endpoint is
> accessed.**"

Two distinct events per successful request:

1. **`http_request`** — written by `httpLogger` middleware mounted at the
   top of the stack. Fields: `method`, `url`, `status` (after response),
   `durationMs`, `meta: { ip, userAgent }`.
2. **`endpoint_access`** — written by `logEndpoint(name, meta)` invoked
   inside each route handler. Fields: `msg = endpoint name`, `meta = relevant
   request data` (e.g. `{ userid, year, month }` for the report).

Both go through Pino → custom transport that does
`Log.create({ level, time, msg, ...fields })`.
Q8 confirms additional log entries beyond these are allowed.

## 8. Computed pattern (the report)

```
isFutureOrCurrent(year, month) ?
    return computeReport(userid, year, month)        # never cached
  :
    cached = Reports.findOne({userid, year, month})
    if cached: return cached.payload
    payload = computeReport(userid, year, month)
    Reports.findOneAndUpdate({...key}, {$setOnInsert:{payload}}, {upsert:true})
    return payload
```

Safe because the spec forbids back-dated cost inserts → past months are
immutable. Full details in [COMPUTED_PATTERN.md](COMPUTED_PATTERN.md).

The function that implements this MUST carry a **C-style block comment**
explaining the design (Q4 — explicit grading note).

## 9. Comments policy (Q4 — grading risk)

**Don't use JSDoc.** Spec Q4 explicitly says it is not required. Use:

- **C-style block comments `/* ... */`** for module headers and any
  multi-line explanation. The computed-pattern function MUST have one.
- **C++-style `// ...` line comments** above the code line(s) being
  explained. **No more than 8–9 lines may pass without one** — this is
  an explicit grading rule.
- **All comments in English.** (Reject code `COMMENTS`.)

## 9b. Naming conventions (reject codes `FUNCTIONNAME`, `VARIABLENAME`, `CLASSNAME`, `FILENAME`)

| Kind | Rule | Examples |
|---|---|---|
| Variables | lowercase if single word; `camelCase` if multi-word | `total`, `userId`, `cachedReport` |
| Functions | same as variables | `addCost`, `computeReport` |
| Constructors / classes | `PascalCase` | `User`, `CostReport` |
| Anonymous fns assigned to a variable | rule applies to the **variable** | `const computeReport = () => {...}` |
| Files | lowercase only; `_` separator if multi-word | `users.js`, `validation.js`, `report_cache.test.js` |

**Never use `var`.** (Reject code `CONSTLET`.) `const` by default;
`let` only when reassignment is needed.

## 9c. Response-shape discipline (reject code `USER`)

Response builders explicitly pick the spec's properties — they never
return raw Mongoose documents. `_id`, `__v`, and any fields not listed
in the spec are stripped. One small `pickPublic(doc, fields)` helper in
`shared/` is enough.

## 10. Build order (phases)

1. **Scaffold** — workspaces `package.json`, `.env.example`, `.gitignore`,
   folder skeleton, root scripts (`dev:*`, `start`, `test`, `seed`).
2. **Shared layer** — `env.js`, `db.js`, `models/*`, `validation.js`,
   `logger.js` (with the Mongo transport + endpoint helper).
3. **about service** — smallest, no DB. Proves the process pattern works
   end-to-end (request → log → response) before touching Mongo.
4. **users service** — including the `total` aggregation.
5. **costs service** — `POST /api/add` first (with user-exists check and
   past-date rejection), then `GET /api/report` with the computed cache.
6. **logs service** — read-only over the `logs` collection populated by
   phases 3–5.
7. **Tests** — Jest + supertest + `mongodb-memory-server`. Cover happy
   path, validation errors, not-found cases, **and explicitly assert the
   cache hit on the second past-month report** (e.g. spy on
   `Cost.aggregate`).
8. **Comments + style pass** — sweep every file:
   - no 8–9 line stretch without a `//` comment
   - C-style `/* */` block on the computed-pattern function and as a
     module header on every file
   - **all comments in English** (`COMMENTS`)
   - no `var` anywhere (`CONSTLET`)
   - file names lowercase + `_` separator (`FILENAME`)
   - functions/variables `camelCase`, classes `PascalCase`
     (`FUNCTIONNAME`/`VARIABLENAME`/`CLASSNAME`)
   - response shapes return only spec-listed fields (`USER`)
9. **Seed + deploy** — `scripts/seed.js` for the single `mosh israeli`
   user (with a placeholder birthday — spec doesn't specify one but our
   schema requires it; we'll use `1990-01-01`); deploy each service to
   Render → 4 public URLs.
10. **Submission package** — 60-second unlisted YouTube demo; PDF
    `<firstname>_<lastname>.pdf` with all source and required header
    info; ZIP without `node_modules`; submission form filled with the
    four URLs.

## 11. Stack

Node + Express, Mongoose 8 (for `Schema.Types.Double`), Pino, dotenv,
Jest + supertest + mongodb-memory-server, concurrently (dev convenience),
nodemon (dev).

## 12. Notes

- **Date-only vs full-datetime for cost `date`.** We accept full ISO
  datetime; the report uses `$dayOfMonth` so day-precision is fine
  either way.

## 13. Submission checklist

- [ ] Four URLs respond on the public internet (the four entries for
      letters `a`/`b`/`c`/`d` in the test program)
- [ ] Submitted URLs have **no trailing or redundant slashes**
      (reject `SLASH`)
- [ ] All 4 URLs verified reachable from a clean browser/curl
      (reject `URL`)
- [ ] Database is empty except for the single `mosh israeli` user
      (`id: 123123`, `first_name: mosh`, `last_name: israeli`)
- [ ] All 7 endpoints work end-to-end against the deployed services
- [ ] Empty-DB report returns all 5 categories as empty arrays
      (reject `EMPTYREPORT`)
- [ ] Demo video uploaded (unlisted) on YouTube
- [ ] PDF `firstname_lastname.pdf` — lowercase, includes team manager
      name (rejects `PDFNAME`, `FILENAME`)
- [ ] PDF starts with: team manager name; each member's
      first + last + ID + mobile + email; **clickable** video link
      (reject `CLICKABLE`); ≤ 100-word summary of two collaborative
      tools used
- [ ] PDF: every source file headed by its filename, **no broken lines**
      (reject `BROKENLINES`), code left-aligned and monospaced
      (reject `CODEFORMAT`)
- [ ] ZIP excludes `node_modules`, uploaded **separately** from PDF —
      do NOT pack the PDF inside the ZIP (reject `TWOFILES`)
- [ ] Submission form filled with the four URLs (reject `FORM`)
- [ ] Team manager attends the online testing meeting (reject `ATTENDANCE`)

## 14. Pending input from user

- A "**rejects** file" — a list of patterns / pitfalls to avoid during
  coding. To be incorporated into this plan once received.
