// tests for the about endpoint
'use strict';

const request = require('supertest');

// these have to be set before we require the app, since env.js reads them on load
process.env.TEAM_MEMBERS = JSON.stringify([
  { first_name: 'Dan', last_name: 'Elbaz' },
  { first_name: 'Shahaf', last_name: 'Attias' },
  { first_name: 'Masanbat', last_name: 'Mulu' },
]);
// about doesn't use mongo, but env.js still insists on a uri
process.env.MONGO_URI = 'mongodb://localhost/test';

const app = require('../services/about/index');

describe('GET /api/about', () => {
  test('returns team members with correct shape', async () => {
    const res = await request(app).get('/api/about');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);

    // just the two name fields, nothing extra
    for (const member of res.body) {
      expect(member).toHaveProperty('first_name');
      expect(member).toHaveProperty('last_name');
      expect(Object.keys(member).sort()).toEqual(['first_name', 'last_name'].sort());
    }
  });

  // the tester calls it with a trailing slash, so make sure that works
  test('responds to trailing slash', async () => {
    const res = await request(app).get('/api/about/');
    expect(res.status).toBe(200);
  });

  test('returns correct names', async () => {
    // the names should match what we put in TEAM_MEMBERS above
    const res = await request(app).get('/api/about');
    expect(res.body[0].first_name).toBe('Dan');
    expect(res.body[0].last_name).toBe('Elbaz');
    expect(res.body[1].first_name).toBe('Shahaf');
    expect(res.body[1].last_name).toBe('Attias');
    expect(res.body[2].first_name).toBe('Masanbat');
    expect(res.body[2].last_name).toBe('Mulu');
  });
});
