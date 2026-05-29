// costs service — add cost items and build the monthly report
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_COSTS } = require('../../shared/env');
const { validateAddCost, validateReportQuery } = require('../../shared/validation');
const Cost   = require('../../shared/models/costs');
const User   = require('../../shared/models/users');
const Report = require('../../shared/models/reports');
const { CATEGORIES } = require('../../shared/models/costs');

// express app; httpLogger records every request that comes in
const app = express();
app.use(express.json());
app.use(httpLogger);

app.post('/api/add', async (req, res, next) => {
  logEndpoint('add_cost', { userid: req.body.userid });

  // check the body before we go near the database
  const validation = validateAddCost(req.body);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  const { description, category, userid, sum, date } = req.body;

  try {
    // no point adding a cost for someone who isn't in the users collection
    const userExists = await User.exists({ id: userid });
    if (!userExists) {
      return res.status(404).json({ id: 'not_found', message: 'user not found' });
    }

    // if the caller didn't send a date, the schema default (now) kicks in
    const costData = { description, category, userid, sum };
    if (date !== undefined) {
      costData.date = new Date(date);
    }

    const cost = await Cost.create(costData);

    // echo back the cost we just saved
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

app.get('/api/report', async (req, res, next) => {
  logEndpoint('get_report', { id: req.query.id, year: req.query.year, month: req.query.month });

  // id/year/month all have to be valid numbers
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
 * This is the computed-pattern bit. A finished (past) month can never change
 * because we don't accept costs dated in the past, so the first time someone
 * asks for it we compute the report once and stash it in the reports
 * collection — every later request for the same month just reads it back.
 * The current month and future months can still gain costs, so those we always
 * recompute on the fly and never cache.
 */
const getReport = async (userId, year, month) => {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isPast =
    year < currentYear || (year === currentYear && month < currentMonth);

  if (isPast) {
    const cached = await Report.findOne({ userid: userId, year, month });
    if (cached) {
      return cached.payload;
    }

    // first request for this month — compute once and remember it.
    // upsert + $setOnInsert so two parallel requests can't double-write.
    const payload = await computeReport(userId, year, month);
    await Report.findOneAndUpdate(
      { userid: userId, year, month },
      { $setOnInsert: { userid: userId, year, month, payload } },
      { upsert: true }
    );
    return payload;
  }

  return computeReport(userId, year, month);
};

// Pull the month's costs out of Mongo and reshape them into the report JSON.
const computeReport = async (userId, year, month) => {
  // half-open range [first of month, first of next month)
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);

  const agg = await Cost.aggregate([
    // this user's costs within the month
    { $match: { userid: userId, date: { $gte: start, $lt: end } } },
    // keep only what the report needs, and turn the date into a day-of-month
    {
      $project: {
        _id:         0,
        category:    1,
        sum:         1,
        description: 1,
        day: { $dayOfMonth: '$date' },
      },
    },
    // bucket the costs by category
    {
      $group: {
        _id:   '$category',
        items: { $push: { sum: '$sum', description: '$description', day: '$day' } },
      },
    },
  ]);

  const byCategory = {};
  for (const group of agg) {
    byCategory[group._id] = group.items;
  }

  // every category shows up, even the empty ones
  const costs = CATEGORIES.map((cat) => ({ [cat]: byCategory[cat] || [] }));

  return { userid: userId, year, month, costs };
};

// anything that slips through ends up here as a generic 500
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// connect to mongo and start listening (skipped when required from a test)
if (require.main === module) {
  connect().then(() => {
    app.listen(PORT_COSTS, () => {
      console.log(`costs service running on port ${PORT_COSTS}`);
    });
  });
}

module.exports = app;
