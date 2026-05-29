// users service — add a user, list users, get one user with their total spend
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_USERS } = require('../../shared/env');
const { validateAddUser, validateUserId } = require('../../shared/validation');
const User = require('../../shared/models/users');
const Cost = require('../../shared/models/costs');

// express app; httpLogger records every request that comes in
const app = express();
app.use(express.json());
app.use(httpLogger);

app.post('/api/add', async (req, res, next) => {
  logEndpoint('add_user', { id: req.body.id });

  // validate the body first
  const validation = validateAddUser(req.body);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  const { id, first_name, last_name, birthday } = req.body;

  try {
    // two users can't share the same id
    const exists = await User.exists({ id });
    if (exists) {
      return res.status(409).json({ id: 'conflict', message: 'user id already exists' });
    }

    const user = await User.create({ id, first_name, last_name, birthday });

    // send back the user we just created
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

// everyone in the collection
app.get('/api/users', async (req, res, next) => {
  logEndpoint('list_users');
  try {
    const users = await User.find({}, { _id: 0, __v: 0 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// single user + the sum of everything they've spent
app.get('/api/users/:id', async (req, res, next) => {
  logEndpoint('get_user', { id: req.params.id });

  const validation = validateUserId(req.params.id);
  if (!validation.ok) {
    return res.status(400).json({ id: validation.id, message: validation.message });
  }

  try {
    const user = await User.findOne({ id: validation.id });
    if (!user) {
      return res.status(404).json({ id: 'not_found', message: 'user not found' });
    }

    // add up all of this user's costs in one go
    const agg = await Cost.aggregate([
      { $match: { userid: validation.id } },
      { $group: { _id: null, total: { $sum: '$sum' } } },
    ]);

    // no costs yet means a total of 0
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

// anything that slips through ends up here as a generic 500
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// connect to mongo and start listening (skipped when required from a test)
if (require.main === module) {
  connect().then(() => {
    app.listen(PORT_USERS, () => {
      console.log(`users service running on port ${PORT_USERS}`);
    });
  });
}

module.exports = app;
