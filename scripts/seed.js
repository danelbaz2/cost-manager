/* seed.js — inserts the single required imaginary user for submission */
'use strict';

// Load environment variables from .env before connecting
require('../shared/env');
const { connect, disconnect } = require('../shared/db');
const User = require('../shared/models/users');

/* The spec requires exactly one user in the DB at submission time:
   id: 123123, first_name: mosh, last_name: israeli.
   Birthday is not specified by the spec but is required by the schema;
   we use 1990-01-01 as confirmed during planning. */
const SEED_USER = {
  id:         123123,
  first_name: 'mosh',
  last_name:  'israeli',
  birthday:   new Date('1990-01-01T00:00:00.000Z'),
};

const run = async () => {
  await connect();

  // Remove all existing users so the DB is clean before seeding
  await User.deleteMany({});

  // Insert the single required user
  await User.create(SEED_USER);
  console.log('Seed complete: inserted user', SEED_USER.id);

  await disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
