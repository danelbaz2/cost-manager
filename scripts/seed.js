// puts a single demo user in the database
'use strict';

require('../shared/env');
const { connect, disconnect } = require('../shared/db');
const User = require('../shared/models/users');

// the schema needs a birthday even though we only really care about the rest
const SEED_USER = {
  id:         123123,
  first_name: 'mosh',
  last_name:  'israeli',
  birthday:   new Date('1990-01-01T00:00:00.000Z'),
};

const run = async () => {
  await connect();

  // start from a clean users collection, then add the one user
  await User.deleteMany({});
  await User.create(SEED_USER);
  console.log('Seed complete: inserted user', SEED_USER.id);

  await disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
