/* env.js — loads .env and validates all required keys */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Required keys that every service depends on
const REQUIRED = ['MONGO_URI'];

// Validate that each required key exists and is non-empty
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Crash early so the problem is obvious at startup
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  // PORT (no suffix) is injected by Render; fall back to service-specific port
  PORT_USERS: parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_USERS, 10) || 3001,
  PORT_COSTS: parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_COSTS, 10) || 3002,
  PORT_LOGS:  parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_LOGS,  10) || 3003,
  PORT_ABOUT: parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_ABOUT, 10) || 3004,
  // Team members stored as JSON string in .env; fallback to empty array
  TEAM_MEMBERS: JSON.parse(process.env.TEAM_MEMBERS || '[]'),
};
