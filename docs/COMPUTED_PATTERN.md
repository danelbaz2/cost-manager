# Computed Design Pattern — Monthly Report

The spec says:

> "When a report is requested for a month that has already passed, that
> report will be saved for further requests for getting it."

> "The server side doesn't allow adding costs with dates that belong to the
> past."

Together those two rules mean: **once a month ends, its set of costs is
frozen.** That's the pre-condition that lets us safely cache the report.

## Algorithm

```
function getReport(userid, year, month):
    if (year, month) is the CURRENT month or in the future:
        # cannot cache — there could be more costs added
        return computeReport(userid, year, month)

    cached = reports.findOne({ userid, year, month })
    if cached:
        return cached.payload

    payload = computeReport(userid, year, month)
    reports.insertOne({ userid, year, month, payload })   # upsert if race
    return payload
```

`computeReport` runs a single Mongoose aggregation:

1. `$match`  — `userid` and a `date` range covering the month.
2. `$project` — keep `sum`, `description`, `category`, and `day = $dayOfMonth: $date`.
3. `$group`   — by `category`, pushing `{ sum, description, day }`.

After the aggregation, we shape the result so that every category in
`CATEGORIES` appears even if it has zero items, matching the sample JSON in
the spec exactly.

## Why this is the computed pattern

The classic Computed Pattern (per MongoDB docs) is "store the answer, not
the inputs, when the inputs are stable and the read cost matters."

- **Inputs are stable**: past months can never gain new costs.
- **Read cost matters**: the report is a per-user dashboard view, likely
  hit repeatedly.
- **Write cost is one-shot**: we compute the aggregation once on first
  read and never again.

## Race / consistency notes

- We `findOneAndUpdate` with `upsert: true` so two simultaneous first-time
  requests can't insert duplicate cache rows. The unique index
  `{ userid, year, month }` enforces this at the DB level too.
- If a report for the *current* month is requested, we always recompute —
  the cache is never written for it, because new costs can still arrive.
- If the spec ever loosens to allow back-dated costs, we add a cache
  invalidation hook on cost insert. For now, the past-date rejection makes
  that unnecessary.

## Test for the pattern

```js
test('past-month report is cached after first call', async () => {
  await request(app).get('/api/report?id=1&year=2024&month=1');     // miss
  const spy = jest.spyOn(Cost, 'aggregate');
  await request(app).get('/api/report?id=1&year=2024&month=1');     // hit
  expect(spy).not.toHaveBeenCalled();
});
```
