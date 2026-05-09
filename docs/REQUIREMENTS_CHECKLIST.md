# Requirements Checklist

A line-by-line audit: every requirement from the project spec and Q&A,
mapped to where in the plan/code it's covered. Used to verify nothing
falls through the cracks before submission.

Legend: ☐ planned · ☑ implemented · ⚠ open question

---

## Database

| # | Requirement                                                                          | Status | Where covered |
|---|--------------------------------------------------------------------------------------|:------:|---------------|
| D1 | MongoDB Atlas                                                                       | ☐ | `.env` `MONGO_URI`; `shared/db.js` |
| D2 | Collections `users`, `costs`, `logs` (at minimum)                                   | ☐ | `shared/models/{users,costs,logs}.js` |
| D3 | Implements the Computed design pattern                                              | ☐ | `shared/models/reports.js` + costs service `getReport` |
| D4 | Categories supported: food, health, housing, sports, education                      | ☐ | `costs.js` schema enum |
| D5 | `users` schema: `id`(Number), `first_name`(String), `last_name`(String), `birthday`(Date) | ☐ | `shared/models/users.js` |
| D6 | `id` ≠ `_id` — never confuse them                                                   | ☐ | All response shaping omits `_id` and `__v` |
| D7 | `costs` schema: `description`(String), `category`(String), `userid`(Number), `sum`(Double) | ☐ | `shared/models/costs.js` (uses `Schema.Types.Double`) |

## Application stack

| # | Requirement                                              | Status | Where covered |
|---|----------------------------------------------------------|:------:|---------------|
| A1 | Express.js                                               | ☐ | each `services/*/index.js` |
| A2 | Mongoose                                                 | ☐ | `shared/models/*` |
| A3 | Pino                                                     | ☐ | `shared/logger.js` |
| A4 | JavaScript only (no TypeScript)                          | ☐ | All `.js` files |
| A5 | Code that works with MongoDB lives in folder named `models` | ☐ | `shared/models/` (and re-export `models/` per service) |

## Endpoints

| # | Endpoint                | Spec details                                                                  | Status | Where |
|---|-------------------------|-------------------------------------------------------------------------------|:------:|-------|
| E1 | `POST /api/add` (cost) | params: description, category, userid, sum. date defaults to now if not sent. | ☐ | costs service |
| E2 | `GET /api/report`      | query: id, year, month. grouped by category. each item: sum, day, description. Computed pattern. **Empty categories included.** | ☐ | costs service |
| E3 | `GET /api/users/:id`   | reply: `first_name`, `last_name`, `id`, `total` (sum of all costs).            | ☐ | users service |
| E4 | `GET /api/about`       | array of `{ first_name, last_name }` only. Not stored in DB.                   | ☐ | about service |
| E5 | `GET /api/users`       | all users, property names match `users` collection.                            | ☐ | users service |
| E6 | `GET /api/logs`        | all logs, property names match `logs` collection.                              | ☐ | logs service |
| E7 | `POST /api/add` (user) | params: id, first_name, last_name, birthday. returns added user.               | ☐ | users service |

## Error format

| # | Requirement                                                | Status | Where |
|---|------------------------------------------------------------|:------:|-------|
| ER1 | Error replies are JSON with at minimum `id` and `message`. | ☐ | `errorHandler` middleware in every service |

## Logging

| # | Requirement                                                                    | Status | Where |
|---|--------------------------------------------------------------------------------|:------:|-------|
| L1 | Use Pino                                                                       | ☐ | `shared/logger.js` |
| L2 | Logs persisted to MongoDB `logs` collection                                    | ☐ | Custom Pino transport → `Log.create()` |
| L3 | Log entry per HTTP request (`http_request`)                                    | ☐ | `httpLogger` middleware |
| L4 | Log entry per endpoint access (`endpoint_access`)                              | ☐ | `logEndpoint(...)` in each route handler |
| L5 | Additional log entries allowed beyond the required ones (Q8)                   | ☐ | Free to add |

## Configuration

| # | Requirement                                       | Status | Where |
|---|---------------------------------------------------|:------:|-------|
| C1 | `.env` file used (per class)                      | ☐ | `.env`, `.env.example`, `shared/env.js` |

## Process architecture

| # | Requirement                                                                         | Status | Where |
|---|-------------------------------------------------------------------------------------|:------:|-------|
| P1 | Four separate processes — NOT four routes in one project (Q14)                      | ☐ | 4 services × `index.js` |
| P2 | Process **a** = logs (admin: getting logs)                                          | ☐ | `services/logs` |
| P3 | Process **b** = users (get user details, add user, list users)                      | ☐ | `services/users` |
| P4 | Process **c** = costs (add cost, monthly report)                                    | ☐ | `services/costs` |
| P5 | Process **d** = about (developers details)                                          | ☐ | `services/about` |
| P6 | If on same server, different ports                                                  | ☐ | 3001/3002/3003/3004 locally |
| P7 | If on different servers, ports may overlap                                          | ☐ | Render assigns one port |

## Tests

| # | Requirement                                                                  | Status | Where |
|---|------------------------------------------------------------------------------|:------:|-------|
| T1 | Detailed unit tests for each endpoint                                        | ☐ | `tests/` |
| T2 | Test file naming: `*.test.js` allowed (Q6)                                   | ☐ | Jest convention |
| T3 | Self-contained DB for tests                                                  | ☐ | `mongodb-memory-server` |
| T4 | Computed-pattern cache hit asserted (second past-month request hits cache)   | ☐ | `tests/report.cache.test.js` |

## Code style & comments (Q4 — explicit grading)

| # | Requirement                                                              | Status | Where |
|---|--------------------------------------------------------------------------|:------:|-------|
| S1 | Follow Professional JavaScript Style Guide (semicolons, single quotes, strict equality, meaningful names) | ☐ | All files |
| S2 | **JSDoc not required** — don't waste points on it                        | ☐ | — |
| S3 | C-style block comments `/* */` for module headers / multi-line notes     | ☐ | Every file |
| S4 | C++-style `// ...` comments above each block of code                     | ☐ | Every file |
| S5 | **No 8–9 line stretch without a `//` comment** — explicit rubric item    | ☐ | Comments pass (Phase 8) |
| S6 | Computed pattern code MUST have a `/* */` block comment explaining design | ☐ | `services/costs/report.js` |
| S7 | Files in `models/` may use `.model.js` suffix (Q5) — optional             | ☐ | We're using bare names |

## Validation (Q1 — explicit)

| # | Requirement                                                          | Status | Where |
|---|----------------------------------------------------------------------|:------:|-------|
| V1 | Validate every piece of data reaching every endpoint                 | ☐ | `shared/validation.js` per-endpoint |
| V2 | Verify `userid` exists when adding a cost (Q11)                      | ☐ | `addCost` does `User.exists({ id: userid })` |
| V3 | Q12: existence check via dedicated endpoint is OPTIONAL              | ☐ | Decision: use direct DB read; no extra endpoint |

## Computed pattern subtleties

| # | Requirement                                                              | Status | Where |
|---|--------------------------------------------------------------------------|:------:|-------|
| CP1 | Past-month report cached after first computation                        | ☐ | `getReport` upserts into `reports` |
| CP2 | Server doesn't allow adding costs with past dates                       | ☐ | `addCost` rejects `date < now` |
| CP3 | Current month + future month reports must work (Q7) — never cached      | ☐ | `getReport` skips cache for current/future |
| CP4 | Empty-month report still includes every category (sample + Q15)         | ☐ | `computeReport` reshapes against full enum |

## Deployment

| # | Requirement                                              | Status | Where |
|---|----------------------------------------------------------|:------:|-------|
| DP1 | Each microservice deployed in a separate process        | ☐ | 4 Render Web Services |
| DP2 | Submission form filled with the four URLs               | ☐ | Submission step |
| DP3 | DB empty except for one user (`id 123123`, `mosh`, `israeli`) | ☐ | `scripts/seed.js`; ⚠ birthday placeholder `1990-01-01` |

## Submission package

| # | Requirement                                                              | Status | Where |
|---|--------------------------------------------------------------------------|:------:|-------|
| SB1 | ≤60-second unlisted YouTube video                                       | ☐ | Pre-submission |
| SB2 | ZIP of project (no `node_modules`)                                      | ☐ | Pre-submission |
| SB3 | PDF `firstname_lastname.pdf` (lowercase) with all source and filename headers | ☐ | Pre-submission |
| SB4 | PDF header: team manager name; each member's name+ID+mobile+email; clickable video link; ≤100-word summary of 2 collaboration tools | ☐ | Pre-submission |
| SB5 | Team manager submits both files separately on Moodle                    | ☐ | Pre-submission |
| SB6 | Treat deadline as 30 minutes earlier than Moodle shows                  | — | Awareness |

---

## Reject-codes coverage (full list in [REJECTS.md](REJECTS.md))

| Code | Pts | Mitigation in this project |
|---|:--:|---|
| EMPTYREPORT | -5 | `computeReport` always returns all 5 categories; empty-DB test asserts shape |
| ADDCOST     | -5 | Validation + integration test for `POST /api/add` (cost) |
| REPORT      | -5 | End-to-end "add → report" test diffs against spec sample |
| ABOUT       | -5 | About handler returns only `{ first_name, last_name }`; tested |
| SLASH       | -5 | Submission step: paste bare service origin in form |
| URL         | -5 | Smoke-test all 4 URLs before submitting |
| ATTENDANCE  | -5 | Calendar reminder for testing meeting |
| FORM        | -5 | Submission step |
| USER        | -5 | Response shapes explicitly pick spec fields; no Mongoose leakage |
| COMMENTS    | -3 | Comments pass; English only; no 8–9 line stretch uncommented |
| PDFNAME     | -3 | `firstname_lastname.pdf` (lowercase) |
| TWOFILES    | -3 | Upload PDF + ZIP separately; never nest PDF inside ZIP |
| FUNCTIONNAME| -3 | `camelCase` for fns; `PascalCase` for constructors |
| VARIABLENAME| -3 | `camelCase`; constants `UPPER_SNAKE` only when truly constant |
| CLASSNAME   | -3 | `PascalCase` |
| FILENAME    | -3 | `lowercase` or `lowercase_with_underscores.js` |
| CLICKABLE   | -3 | PDF generation: insert YouTube link as actual hyperlink |
| BROKENLINES | -3 | PDF: smaller font and/or landscape; visual check |
| CODEFORMAT  | -3 | PDF: monospace, left-aligned; spot-check every file |
| CONSTLET    | -3 | `var` banned; `const` by default, `let` only when needed |

---

## Confirmed decisions

- ✅ **CP2 strictness** — strict: reject any cost `date < Date.now()`.
- ✅ **DP3 birthday** — seed user gets `1990-01-01T00:00:00.000Z`.
- ✅ **POST /api/add (user) duplicate id** — rejected with HTTP 409
  `{ id: "conflict", message: "user id already exists" }`.

---

## Pending: rejects file

A list of patterns/pitfalls to avoid will be supplied separately and
incorporated into this checklist as additional rows when received.
