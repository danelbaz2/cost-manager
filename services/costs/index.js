/* costs/index.js — Process c: cost items and monthly report endpoints */
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_COSTS } = require('../../shared/env');
const { validateAddCost, validateReportQuery } = require('../../shared/validation');
const Cost   = require('../../shared/models/costs');
const User   = require('../../shared/models/users');
const Report = require('../../shared/models/reports');

// All supported expense categories (must match costs schema enum)
const { CATEGORIES } = require('../../shared/models/costs');

const app = express();
app.use(express.json());

// Log every incoming HTTP request to MongoDB
app.use(httpLogger);

/*
 * POST /api/add
 * Adds a new cost item for an existing user.
 * Required body: description, category, userid, sum.
 * Optional body: date (defaults to request time; past dates rejected).
 */
app.post('/api/add', async (req, res, next) => {
  logEndpoint('add_cost', { userid: req.body.userid });

  // Validate all fields including the optional date
  const validation = validateAddCost(req.body);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  const { description, category, userid, sum, date } = req.body;

  try {
    // Verify the referenced user actually exists (Q11)
    const userExists = await User.exists({ id: userid });
    if (!userExists) {
      return res.status(404).json({ id: 'not_found', message: 'user not found' });
    }

    // Build the new cost document; date defaults to now if omitted
    const costData = { description, category, userid, sum };
    if (date !== undefined) {
      costData.date = new Date(date);
    }

    const cost = await Cost.create(costData);

    // Return only the spec-required fields — no _id or __v
    res.status(201).json({
      id:          cost._id,
      description: cost.description,
      category:    cost.category,
      userid:      cost.userid,
      sum:         cost.sum,
      date:        cost.date,
    });
  } catch (err) {
    next(err);
  }
});

/*
 * GET /api/report
 * Returns a monthly cost report grouped by category.
 * Implements the Computed Design Pattern: past-month reports are cached
 * in the reports collection after the first computation.
 */
app.get('/api/report', async (req, res, next) => {
  logEndpoint('get_report', { id: req.query.id, year: req.query.year, month: req.query.month });

  // Validate query parameters
  const validation = validateReportQuery(req.query);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  const { userId, year, month } = validation;

  try {
    const payload = await getReport(userId, year, month);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

/*
 * getReport — implements the Computed Design Pattern.
 *
 * For the current month or any future month: always recompute from the
 * costs collection (Q7 — these months must work; cannot cache because
 * new costs may still arrive).
 *
 * For past months: check the reports cache first. On cache miss, compute
 * the report, store it with upsert (race-safe), and return it. On cache
 * hit, return the stored payload without re-querying costs.
 *
 * This is safe because the spec forbids adding costs with past dates,
 * so once a month ends its set of costs is permanently frozen.
 */
const getReport = async (userId, year, month) => {
  // Check whether the requested month is in the past
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isPast =
    year < currentYear || (year === currentYear && month < currentMonth);

  if (isPast) {
    // Try to find a cached report first
    const cached = await Report.findOne({ userid: userId, year, month });
    if (cached) {
      return cached.payload;
    }

    // Cache miss — compute the report and store it
    const payload = await computeReport(userId, year, month);
    await Report.findOneAndUpdate(
      { userid: userId, year, month },
      { $setOnInsert: { userid: userId, year, month, payload } },
      { upsert: true }
    );
    return payload;
  }

  // Current or future month — always compute fresh
  return computeReport(userId, year, month);
};

/*
 * computeReport — runs the aggregation and shapes the result to match
 * the exact JSON format shown in the spec (array of single-key objects,
 * one per category, each containing { sum, description, day } items).
 * Every category appears even when it has no costs (Q15, April 30 update).
 */
const computeReport = async (userId, year, month) => {
  // Build the date range that covers the full requested month
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);

  const agg = await Cost.aggregate([
    // Match costs for this user within the requested month
    { $match: { userid: userId, date: { $gte: start, $lt: end } } },
    // Project the fields needed for the report plus the day of month
    {
      $project: {
        _id:         0,
        category:    1,
        sum:         1,
        description: 1,
        day: { $dayOfMonth: '$date' },
      },
    },
    // Group by category, collecting each cost's fields into an array
    {
      $group: {
        _id:   '$category',
        items: { $push: { sum: '$sum', description: '$description', day: '$day' } },
      },
    },
  ]);

  // Build a map of category -> items from the aggregation result
  const byCategory = {};
  for (const group of agg) {
    byCategory[group._id] = group.items;
  }

  // Shape into the spec's array-of-single-key-objects format
  // All five categories must appear, even those with no costs
  const costs = CATEGORIES.map((cat) => ({ [cat]: byCategory[cat] || [] }));

  return { userid: userId, year, month, costs };
};

// Centralised error handler — always returns { id, message }
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// Connect to MongoDB then start listening
if (require.main === module) {
  connect().then(() => {
    app.listen(PORT_COSTS, () => {
      console.log(`costs service running on port ${PORT_COSTS}`);
    });
  });
}

module.exports = app;
