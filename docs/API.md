# API Reference

All endpoints return JSON. Errors always have the shape:

```json
{ "id": "machine_readable_code", "message": "human readable description" }
```

The `id` codes we use: `validation_error`, `not_found`, `conflict`,
`internal_error`, `past_date_not_allowed`.

---

## Users service (port 3001)

### `POST /api/add` — create user

**Body**

| Field        | Type    | Required | Notes                          |
| ------------ | ------- | -------- | ------------------------------ |
| `id`         | Number  | yes      | Unique user id                 |
| `first_name` | String  | yes      |                                |
| `last_name`  | String  | yes      |                                |
| `birthday`   | Date    | yes      | ISO 8601 string                |

**200 / 201 response**

```json
{ "id": 123123, "first_name": "mosh", "last_name": "israeli",
  "birthday": "1990-01-01T00:00:00.000Z" }
```

### `GET /api/users` — list users

Returns an array of user documents using the same property names as the
collection.

### `GET /api/users/:id` — single user with total

```json
{ "id": 123123, "first_name": "mosh", "last_name": "israeli", "total": 412 }
```

`total` is a sum of all that user's cost items (Mongoose aggregation).

---

## Costs service (port 3002)

### `POST /api/add` — create cost item

**Body**

| Field         | Type    | Required | Notes                                                                |
| ------------- | ------- | -------- | -------------------------------------------------------------------- |
| `description` | String  | yes      |                                                                      |
| `category`    | String  | yes      | One of `food`, `health`, `housing`, `sports`, `education`            |
| `userid`      | Number  | yes      | Must reference an existing user                                      |
| `sum`         | Number  | yes      | Stored as `Double`                                                   |
| `date`        | Date    | no       | If omitted, server uses `Date.now()`. **Past dates are rejected.**   |

**Response** — the saved cost document.

### `GET /api/report?id=&year=&month=` — monthly report

**Query params**

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `id`    | Number | yes      |
| `year`  | Number | yes      |
| `month` | Number | yes (1–12) |

**Response shape** (matches the spec sample exactly — every category appears
even when empty)

```json
{
  "userid": 123123,
  "year": 2025,
  "month": 11,
  "costs": [
    { "food":      [ { "sum": 12, "description": "choco",     "day": 17 } ] },
    { "education": [ { "sum": 82, "description": "math book", "day": 10 } ] },
    { "health":    [] },
    { "housing":   [] },
    { "sports":    [] }
  ]
}
```

If the requested month is **already past**, the report is computed once and
saved into the `reports` collection. Subsequent requests return the cached
copy. See `COMPUTED_PATTERN.md`.

---

## Logs service (port 3003)

### `GET /api/logs` — list logs

Returns every document in the `logs` collection. Property names match the
collection schema (`level`, `time`, `msg`, `req`, etc.).

---

## About service (port 3004)

### `GET /api/about` — team members

Hardcoded / read from `.env`. **No DB call.**

```json
[
  { "first_name": "Dan",      "last_name": "Elbaz" },
  { "first_name": "Shahaf",   "last_name": "Attias" },
  { "first_name": "Masanbat", "last_name": "Mulu" }
]
```

The reply contains **only** `first_name` and `last_name` per the spec —
nothing else.
