// tests for the users service
'use strict';

const request = require('supertest');
const { startDb, stopDb, clearDb } = require('./helpers/db_helper');

// env first, then the app
process.env.MONGO_URI  = 'mongodb://localhost/test';
process.env.TEAM_MEMBERS = '[]';

const app = require('../services/users/index');

beforeAll(async () => { await startDb(); }, 300000);
afterAll(async () => { await stopDb(); });
beforeEach(async () => { await clearDb(); });

// handy user we reuse across the tests
const seedUser = {
  id:         123123,
  first_name: 'mosh',
  last_name:  'israeli',
  birthday:   '1990-01-01',
};

describe('POST /api/add (user)', () => {
  test('creates a user and returns the correct fields', async () => {
    const res = await request(app).post('/api/add').send(seedUser);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(seedUser.id);
    expect(res.body.first_name).toBe(seedUser.first_name);
    expect(res.body.last_name).toBe(seedUser.last_name);
    // don't leak _id / __v
    expect(res.body._id).toBeUndefined();
    expect(res.body.__v).toBeUndefined();
  });

  test('returns 400 when id is missing', async () => {
    const res = await request(app).post('/api/add').send({
      first_name: 'test', last_name: 'user', birthday: '2000-01-01',
    });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
    expect(res.body.message).toBeDefined();
  });

  // can't add the same id twice
  test('returns 409 on duplicate user id', async () => {
    await request(app).post('/api/add').send(seedUser);
    const res = await request(app).post('/api/add').send(seedUser);
    expect(res.status).toBe(409);
    expect(res.body.id).toBe('conflict');
  });

  test('returns 400 when birthday is not YYYY-MM-DD format', async () => {
    const res = await request(app).post('/api/add').send({ ...seedUser, birthday: '15/05/1990' });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });

  test('returns 400 when birthday is invalid', async () => {
    const res = await request(app).post('/api/add').send({ ...seedUser, birthday: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });

  test('returns 400 when birthday is in the future', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app).post('/api/add').send({ ...seedUser, id: 9999, birthday: future });
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });
});

describe('GET /api/users', () => {
  test('returns empty array when no users exist', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all users after insert', async () => {
    await request(app).post('/api/add').send(seedUser);
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(seedUser.id);
  });
});

describe('GET /api/users/:id', () => {
  test('returns user with total 0 when no costs exist', async () => {
    await request(app).post('/api/add').send(seedUser);
    // a user with no costs should still come back, with total 0
    const res = await request(app).get(`/api/users/${seedUser.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(seedUser.id);
    expect(res.body.first_name).toBe(seedUser.first_name);
    expect(res.body.last_name).toBe(seedUser.last_name);
    expect(res.body.total).toBe(0);
    // this reply is only the four fields — birthday isn't one of them
    expect(res.body.birthday).toBeUndefined();
  });

  test('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/999999');
    expect(res.status).toBe(404);
    expect(res.body.id).toBe('not_found');
  });

  test('returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/api/users/abc');
    expect(res.status).toBe(400);
    expect(res.body.id).toBe('validation_error');
  });
});
