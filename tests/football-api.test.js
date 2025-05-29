const request = require('supertest');
const app = require('../app.js');
const pool = require('../db.js');
const mockAuth = require('../middleware/mocks/mockAuth');
const { getTeamById } = require('../src/football-api/controller.js');

if (process.env.NODE_ENV === 'production') {
  console.error("ERROR: Running tests in production environment is forbidden!");
  process.exit(1);
}

beforeAll(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      google_id VARCHAR(255) NOT NULL,
      access_token TEXT NOT NULL
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS favorite_teams (
      user_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      ip VARCHAR NOT NULL,
      endpoint TEXT NOT NULL,
      timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL
    );`);
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
});


beforeEach(async () => {
  await pool.query('DELETE FROM favorite_teams');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM rate_limits');
  await pool.query('DELETE FROM session');
});

afterAll(async () => {
  try {
    await pool.query('DELETE FROM favorite_teams');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM rate_limits');
    await pool.query('DELETE FROM session');
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await pool.end();
  }
});

describe('GET: getTeamFixtures', () => {
  test('Query params not passed.', async () => {
    const res = await request(app).get('/api/v1/football-api/fixtures');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(["Query parameters required: team, season"]);
  });

  test('teamId param not passed.', async () => {
    const res = await request(app).get('/api/v1/football-api/fixtures?season=2025');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(["Query parameters required: team, season"]);
  });

  test('season param not passed.', async () => {
    const res = await request(app).get('/api/v1/football-api/fixtures?team=1');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(["Query parameters required: team, season"]);
  });
});

describe('GET: searchForTeam', () => {
  test('search param not passed.', async () => {
    const res = await request(app).get('/api/v1/football-api/teams');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(["Missing required query parameter: search"]);
  });
});

describe('GET: getTeamById', () => {
  test('teamId param not passed.', async () => {
    const req = { params: {} }; // no teamId
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getTeamById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ["Missing required path parameter: teamId"]
    });
  });
});