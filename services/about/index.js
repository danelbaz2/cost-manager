/* about/index.js — Process d: GET /api/about (developers team) */
'use strict';

const express = require('express');
const { httpLogger, logEndpoint } = require('../../shared/logger');

// Load env; about service does not need MongoDB
const { PORT_ABOUT, TEAM_MEMBERS } = require('../../shared/env');

const app = express();
app.use(express.json());

// Log every incoming HTTP request to MongoDB
app.use(httpLogger);

/*
 * GET /api/about
 * Returns the list of developers who built this project.
 * Names are read from .env (TEAM_MEMBERS) — not stored in the database,
 * because the DB must be empty except for one seed user at submission time.
 * Response includes only first_name and last_name per the spec.
 */
app.get('/api/about', (req, res) => {
  // Log that this specific endpoint was accessed
  logEndpoint('about');

  // Pick only the two fields the spec allows — no extras
  const members = TEAM_MEMBERS.map(({ first_name, last_name }) => ({
    first_name,
    last_name,
  }));

  res.json(members);
});

// Catch-all error handler — always returns { id, message }
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// Start listening only when run directly (not during tests)
if (require.main === module) {
  app.listen(PORT_ABOUT, () => {
    console.log(`about service running on port ${PORT_ABOUT}`);
  });
}

module.exports = app;
