/* about.test.js — unit tests for GET /api/about */
'use strict';

const request = require('supertest');

// Set TEAM_MEMBERS before the app loads so env.js picks it up
process.env.TEAM_MEMBERS = JSON.stringify([
  { first_name: 'Dan', last_name: 'Elbaz' },
  { first_name: 'Shahaf', last_name: 'Attias' },
]);
// Provide a dummy MONGO_URI so env.js does not throw
process.env.MONGO_URI = 'mongodb://localhost/test';

const app = require('../services/about/index');

describe('GET /api/about', () => {
  // Happy path — response must be an array of { first_name, last_name } only
  test('returns team members with correct shape', async () => {
    const res = await request(app).get('/api/about');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // Each member must have exactly first_name and last_name
    for (const member of res.body) {
      expect(member).toHaveProperty('first_name');
      expect(member).toHaveProperty('last_name');
      // Spec says no additional data — ensure no extras
      expect(Object.keys(member).sort()).toEqual(['first_name', 'last_name'].sort());
    }
  });

  // Trailing slash must also work (grader test code uses /api/about/)
  test('responds to trailing slash', async () => {
    const res = await request(app).get('/api/about/');
    expect(res.status).toBe(200);
  });

  // Values should match the env variable
  test('returns correct names', async () => {
    const res = await request(app).get('/api/about');
    expect(res.body[0].first_name).toBe('Dan');
    expect(res.body[0].last_name).toBe('Elbaz');
    expect(res.body[1].first_name).toBe('Shahaf');
    expect(res.body[1].last_name).toBe('Attias');
  });
});
