// shared mongoose connection — each service calls connect() once on boot
'use strict';

const mongoose = require('mongoose');

const connect = async (uri) => {
  // tests pass their own in-memory uri; otherwise fall back to the .env one
  const connectionUri = uri || require('./env').MONGO_URI;

  await mongoose.connect(connectionUri);
  console.log('MongoDB connected');
};

// the tests call this to close the connection when they're done
const disconnect = async () => {
  await mongoose.disconnect();
};

module.exports = { connect, disconnect };
