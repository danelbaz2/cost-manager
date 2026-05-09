/* db.js — Mongoose connection helper used by every service */
'use strict';

const mongoose = require('mongoose');

/* connect opens one connection to MongoDB Atlas.
   Each service process calls this once at startup. */
const connect = async (uri) => {
  // Allow callers to pass a custom URI (used by tests with in-memory Mongo)
  const connectionUri = uri || require('./env').MONGO_URI;

  await mongoose.connect(connectionUri);
  console.log('MongoDB connected');
};

// Expose disconnect so tests can clean up after themselves
const disconnect = async () => {
  await mongoose.disconnect();
};

module.exports = { connect, disconnect };
