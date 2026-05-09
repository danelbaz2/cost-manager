/* logs/index.js — Process a: admin log reader */
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_LOGS } = require('../../shared/env');
const Log = require('../../shared/models/logs');

const app = express();
app.use(express.json());

// Log every incoming HTTP request to MongoDB
app.use(httpLogger);

/*
 * GET /api/logs
 * Returns all documents in the logs collection.
 * Property names in the response match the logs schema exactly.
 */
app.get('/api/logs', async (req, res, next) => {
  logEndpoint('list_logs');
  try {
    // Return all log entries; exclude internal Mongoose fields
    const logs = await Log.find({}, { _id: 0, __v: 0 });
    res.json(logs);
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
    app.listen(PORT_LOGS, () => {
      console.log(`logs service running on port ${PORT_LOGS}`);
    });
  });
}

module.exports = app;
