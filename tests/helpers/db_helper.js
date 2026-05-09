/* helpers/db_helper.js — in-memory MongoDB setup for tests */
'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');
const { connect, disconnect } = require('../../shared/db');

let mongod;

// Start in-memory Mongo and connect Mongoose before all tests in a suite
const startDb = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await connect(uri);
};

// Disconnect and shut down the in-memory server after all tests
const stopDb = async () => {
  await disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

// Clear all collections between tests so each test starts clean
const clearDb = async () => {
  const mongoose = require('mongoose');
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

module.exports = { startDb, stopDb, clearDb };
