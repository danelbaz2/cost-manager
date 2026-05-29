// tests for the costs service
'use strict';

const request = require('supertest');
const { startDb, stopDb, clearDb } = require('./helpers/db_helper');

process.env.MONGO_URI    = 'mongodb://localhost/test';
process.env.TEAM_MEMBERS = '[]';

const app  = require('../services/costs/index');
const User = require('../shared/models/users');
const Cost = require('../shared/models/costs');

beforeAll(async () => { await startDb(); }, 300000);
afterAll(async () => { await stopDb(); });
beforeEach(async () => { await clearDb(); });

// adding a cost needs an existing user, so put one in first
const seedUser = async () => {
  await User.create({
    id: 123123, first_name: 'mosh', last_name: 'israeli', birthday: new Date('1990-01-01'),
  });
};

describe('POST /api/add (cost)', () => {
  test('creates a cost item and returns correct fields', async () => {
    await seedUser();
    // post a cost without a date and check what comes back
    const res = await request(app).post('/api/add').send({
      userid: 123123, description: 'milk', category: 'food', sum: 8,
    });
    expect(res.status).toBe(201);
    expect(res.body.userid).toBe(123123);
    expect(res.body.description).toBe('milk');
    expect(res.body.category).toBe('food');
    expect(res.body.sum).toBe(8);
    // we didn't send a date, so it should have defaulted to now
    expect(res.body.date).toBeDefined();
    expect(res.body.__v).toBeUndefined();
  });

  test('returns 400 when category is invalid', async () => {
    await seedUser();
    const res = await request(app).post('/api/add').send({
      userid: 123123, description: 'x', category: 'invalid', sum: 5,
    });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });

  test('returns 404 when userid does not exist', async () => {
    const res = await request(app).post('/api/add').send({
      userid: 999, description: 'x', category: 'food', sum: 5,
    });
    expect(res.status).toBe(404);
    expect(res.body.id).toBe('not_found');
  });

  test('returns 400 when sum is negative', async () => {
    await seedUser();
    const res = await request(app).post('/api/add').send({
      userid: 123123, description: 'x', category: 'food', sum: -1,
    });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });

  test('returns 400 when a past date is provided', async () => {
    await seedUser();
    const res = await request(app).post('/api/add').send({
      userid: 123123, description: 'x', category: 'food', sum: 5,
      date: '2000-01-01',
    });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('past_date_not_allowed');
  });

  test('returns 400 when required field is missing', async () => {
    await seedUser();
    // Missing description
    const res = await request(app).post('/api/add').send({
      userid: 123123, category: 'food', sum: 5,
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/report', () => {
  test('every category shows up even with no costs', async () => {
    await seedUser();
    const res = await request(app).get('/api/report?id=123123&year=2026&month=3');
    expect(res.status).toBe(200);
    expect(res.body.userid).toBe(123123);
    expect(res.body.year).toBe(2026);
    expect(res.body.month).toBe(3);

    // all five categories present, each as an empty array
    const cats = res.body.costs.map((obj) => Object.keys(obj)[0]);
    expect(cats).toEqual(expect.arrayContaining(['food', 'health', 'housing', 'sports', 'education']));
    for (const obj of res.body.costs) {
      const items = Object.values(obj)[0];
      expect(Array.isArray(items)).toBe(true);
    }
  });

  test('each cost item carries sum, description and day', async () => {
    await seedUser();
    // a cost in the current month so we can read it straight back
    await Cost.create({
      userid: 123123, description: 'choco', category: 'food', sum: 12,
      date: new Date(),
    });
    const now = new Date();
    const res = await request(app).get(
      `/api/report?id=123123&year=${now.getFullYear()}&month=${now.getMonth() + 1}`
    );
    expect(res.status).toBe(200);

    const foodObj = res.body.costs.find((o) => o.food !== undefined);
    expect(foodObj).toBeDefined();
    expect(foodObj.food.length).toBe(1);
    expect(foodObj.food[0]).toMatchObject({ sum: 12, description: 'choco' });
    expect(typeof foodObj.food[0].day).toBe('number');
  });

  test('a past month is cached after the first request', async () => {
    await seedUser();
    const spy = jest.spyOn(Cost, 'aggregate');

    // first call misses the cache and runs the aggregation
    await request(app).get('/api/report?id=123123&year=2024&month=1');
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();

    // second call for the same month should come from the cache instead
    await request(app).get('/api/report?id=123123&year=2024&month=1');
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  test('returns 400 when month is out of range', async () => {
    const res = await request(app).get('/api/report?id=123123&year=2026&month=13');
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });

  test('returns 400 when id is missing', async () => {
    const res = await request(app).get('/api/report?year=2026&month=5');
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });
});
