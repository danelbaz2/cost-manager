// spins up a throwaway in-memory mongo so the tests don't touch a real database
'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');
const { connect, disconnect } = require('../../shared/db');

let mongod;

const startDb = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await connect(uri);
};

const stopDb = async () => {
  await disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

// wipe every collection so one test can't bleed into the next
const clearDb = async () => {
  const mongoose = require('mongoose');
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

module.exports = { startDb, stopDb, clearDb };
