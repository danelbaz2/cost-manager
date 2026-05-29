// tests for the logs endpoint
'use strict';

const request = require('supertest');
const { startDb, stopDb, clearDb } = require('./helpers/db_helper');

process.env.MONGO_URI    = 'mongodb://localhost/test';
process.env.TEAM_MEMBERS = '[]';

const app = require('../services/logs/index');
const Log = require('../shared/models/logs');

beforeAll(async () => { await startDb(); }, 300000);
afterAll(async () => { await stopDb(); });
beforeEach(async () => { await clearDb(); });

describe('GET /api/logs', () => {
  // hitting the endpoint logs itself, so the array won't be empty — just check the shape
  test('returns 200 with an array', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns log entries that were written to the collection', async () => {
    // drop a known entry in directly and make sure it comes back out
    await Log.create({ level: 30, msg: 'test_entry', method: 'GET', url: '/api/test' });

    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const found = res.body.find((e) => e.msg === 'test_entry');
    expect(found).toBeDefined();

    // no mongoose internals leaking through
    expect(found._id).toBeUndefined();
    expect(found.__v).toBeUndefined();
  });
});
