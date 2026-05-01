# Data Model

All schemas live under `shared/models/`. Mongoose types follow the spec
verbatim.

## `users` collection

```js
const userSchema = new mongoose.Schema({
  id:         { type: Number, required: true, unique: true, index: true },
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  birthday:   { type: Date,   required: true },
});
```

> The spec is explicit that `id` and the Mongo-generated `_id` are different
> properties. We keep `_id` for Mongo's sake but always use `id` in
> request/response bodies.

## `costs` collection

```js
const costSchema = new mongoose.Schema({
  description: { type: String,                                   required: true },
  category:    { type: String, enum: CATEGORIES,                 required: true },
  userid:      { type: Number, index: true,                      required: true },
  sum:         { type: mongoose.Schema.Types.Double,             required: true },
  date:        { type: Date,   default: Date.now },
});
```

`CATEGORIES = ['food', 'health', 'housing', 'sports', 'education']`.
The `Double` BSON type is required by the spec — Mongoose 8 supports it via
`mongoose.Schema.Types.Double`.

## `logs` collection

Pino emits structured JSON. We persist each entry as-is plus a few derived
fields for easy reading:

```js
const logSchema = new mongoose.Schema({
  level:   { type: Number },          // pino numeric level
  time:    { type: Date,   default: Date.now },
  msg:     { type: String },
  method:  { type: String },          // for HTTP request logs
  url:     { type: String },
  status:  { type: Number },
  durationMs: { type: Number },
  meta:    { type: Object },          // catch-all for the rest of the entry
});
```

## `reports` collection (computed-pattern cache)

```js
const reportSchema = new mongoose.Schema({
  userid:    { type: Number, required: true },
  year:      { type: Number, required: true },
  month:     { type: Number, required: true, min: 1, max: 12 },
  payload:   { type: Object, required: true },   // the full JSON we'll send
  createdAt: { type: Date,   default: Date.now },
});
reportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true });
```

`payload` stores the exact response document so cached lookups become a
single `findOne` and a JSON send. See `COMPUTED_PATTERN.md`.

## Initial database state (for submission)

The submitted DB must be empty except for one user:

```json
{ "id": 123123, "first_name": "mosh", "last_name": "israeli",
  "birthday": "1990-01-01T00:00:00.000Z" }
```

We'll provide a `scripts/seed.js` to insert this single document.
