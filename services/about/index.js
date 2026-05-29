// about service — just exposes the team members on /api/about
'use strict';

const express = require('express');
const { connect } = require('../../shared/db');
const { httpLogger, logEndpoint } = require('../../shared/logger');
const { PORT_ABOUT, TEAM_MEMBERS } = require('../../shared/env');

// express app; httpLogger records every request that comes in
const app = express();
app.use(express.json());
app.use(httpLogger);

// The team list lives in .env so we don't have to keep it in the database.
app.get('/api/about', (req, res) => {
  logEndpoint('about');

  // only first/last name go out, nothing else
  const members = TEAM_MEMBERS.map(({ first_name, last_name }) => ({
    first_name,
    last_name,
  }));

  res.json(members);
});

// generic 500 for anything unexpected
app.use((err, req, res, _next) => {
  res.status(500).json({ id: 'internal_error', message: err.message });
});

// connect to mongo (so logs get written) and start listening;
// skipped when this file is required from a test
if (require.main === module) {
  connect().then(() => {
    app.listen(PORT_ABOUT, () => {
      console.log(`about service running on port ${PORT_ABOUT}`);
    });
  });
}

module.exports = app;
