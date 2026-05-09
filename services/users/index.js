/* users/index.js — Process b: user-related endpoints */
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_USERS } = require('../../shared/env');
const {
  validateAddUser,
  validateUserId,
} = require('../../shared/validation');
const User = require('../../shared/models/users');
const Cost = require('../../shared/models/costs');

const app = express();
app.use(express.json());

// Log every incoming HTTP request
app.use(httpLogger);

/*
 * POST /api/add
 * Adds a new user to the database.
 * Required body fields: id, first_name, last_name, birthday.
 * Returns the created user document (spec-listed fields only).
 */
app.post('/api/add', async (req, res, next) => {
  logEndpoint('add_user', { id: req.body.id });

  // Validate all incoming fields before touching the database
  const validation = validateAddUser(req.body);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  const { id, first_name, last_name, birthday } = req.body;

  try {
    // Reject duplicate numeric id (schema marks it unique)
    const exists = await User.exists({ id });
    if (exists) {
      return res.status(409).json({ id: 'conflict', message: 'user id already exists' });
    }

    // Create and persist the new user
    const user = await User.create({ id, first_name, last_name, birthday });

    // Return only the spec-required fields — no _id or __v
    res.status(201).json({
      id:         user.id,
      first_name: user.first_name,
      last_name:  user.last_name,
      birthday:   user.birthday,
    });
  } catch (err) {
    next(err);
  }
});

/*
 * GET /api/users
 * Returns all users in the database.
 * Property names match the users collection exactly.
 */
app.get('/api/users', async (req, res, next) => {
  logEndpoint('list_users');
  try {
    const users = await User.find({}, { _id: 0, __v: 0 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/*
 * GET /api/users/:id
 * Returns a specific user plus the total sum of all their cost items.
 * Reply shape: { first_name, last_name, id, total }
 */
app.get('/api/users/:id', async (req, res, next) => {
  logEndpoint('get_user', { id: req.params.id });

  // Validate the URL parameter
  const validation = validateUserId(req.params.id);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  try {
    const user = await User.findOne({ id: validation.id });
    if (!user) {
      return res.status(404).json({ id: 'not_found', message: 'user not found' });
    }

    // Aggregate all costs for this user to compute the total
    const agg = await Cost.aggregate([
      { $match: { userid: validation.id } },
      { $group: { _id: null, total: { $sum: '$sum' } } },
    ]);

    const total = agg.length > 0 ? agg[0].total : 0;

    res.json({
      id:         user.id,
      first_name: user.first_name,
      last_name:  user.last_name,
      total,
    });
  } catch (err) {
    next(err);
  }
});

// Centralised error handler — always returns { id, message }
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// Connect to MongoDB then start listening
if (require.main === module) {
  connect().then(() => {
    app.listen(PORT_USERS, () => {
      console.log(`users service running on port ${PORT_USERS}`);
    });
  });
}

module.exports = app;
