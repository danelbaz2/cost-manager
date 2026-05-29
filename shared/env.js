// reads the .env file and hands the values to the rest of the app
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// bail out immediately if we can't reach the database
const missing = ['MONGO_URI'].filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  // the host gives us a single PORT in production; locally we use one per service
  PORT_USERS: parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_USERS, 10) || 3001,
  PORT_COSTS: parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_COSTS, 10) || 3002,
  PORT_LOGS:  parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_LOGS,  10) || 3003,
  PORT_ABOUT: parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_ABOUT, 10) || 3004,
  // kept as a JSON string in .env so it never has to live in the database
  TEAM_MEMBERS: JSON.parse(process.env.TEAM_MEMBERS || '[]'),
};
