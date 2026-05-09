/* logs.test.js — unit tests for GET /api/logs */
'use strict';

const request = require('supertest');
const { startDb, stopDb, clearDb } = require('./helpers/db_helper');

process.env.MONGO_URI    = 'mongodb://localhost/test';
process.env.TEAM_MEMBERS = '[]';

const app = require('../services/logs/index');
const Log = require('../shared/models/logs');

beforeAll(async () => { await startDb(); });
afterAll(async () => { await stopDb(); });
beforeEach(async () => { await clearDb(); });

describe('GET /api/logs', () => {
  // The endpoint itself writes log entries via the middleware,
  // so we cannot expect a truly empty array; instead verify the shape
  test('returns 200 with an array', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns log entries that were written to the collection', async () => {
    // Insert a known log entry directly to verify the endpoint reads from the right collection
    await Log.create({ level: 30, msg: 'test_entry', method: 'GET', url: '/api/test' });

    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    // Find our manually inserted entry
    const found = res.body.find((e) => e.msg === 'test_entry');
    expect(found).toBeDefined();

    // Response must not expose Mongoose internals
    expect(found._id).toBeUndefined();
    expect(found.__v).toBeUndefined();
  });
});
