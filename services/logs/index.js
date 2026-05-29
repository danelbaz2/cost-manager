// logs service — read-only view over everything we've logged
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_LOGS } = require('../../shared/env');
const Log = require('../../shared/models/logs');

// express app; httpLogger records every request that comes in
const app = express();
app.use(express.json());
app.use(httpLogger);

// hand back every log entry we've stored
app.get('/api/logs', async (req, res, next) => {
  logEndpoint('list_logs');
  try {
    // drop _id/__v so the response matches the log fields we actually care about
    const logs = await Log.find({}, { _id: 0, __v: 0 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// generic 500 for anything unexpected
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// connect to mongo and start listening (skipped when required from a test)
if (require.main === module) {
  connect().then(() => {
    app.listen(PORT_LOGS, () => {
      console.log(`logs service running on port ${PORT_LOGS}`);
    });
  });
}

module.exports = app;
