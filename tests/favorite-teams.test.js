const request = require('supertest');
const app = require('../app.js');
const pool = require('../db.js');
const mockAuth = require('../middleware/mocks/mockAuth');

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

describe('GET: getFavoriteTeams', () => {
  test('User with no favorite teams.', async () => {
    mockAuth.setUser({ user_id: 1, google_id: 'sample_google_token', access_token: 'sample_token' });

    const res = await request(app).get('/api/v1/favorite-teams');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('User with two favorite teams.', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    await pool.query(`
      INSERT INTO users (user_id, google_id, access_token)
      VALUES (2, 'sample_google_token_2', 'sample_token_2')
      ON CONFLICT (user_id) DO NOTHING`
    );

    await pool.query(`
      INSERT INTO favorite_teams (user_id, team_id)
      VALUES (2, 101), (2, 102);`
    );

    const res = await request(app).get('/api/v1/favorite-teams');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([101, 102]);
  });
});

describe('POST: addFavoriteTeam', () => {
  test('User did not pass a teamId', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    const res = await request(app).post('/api/v1/favorite-teams').send();
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch('Missing teamId in request body');
  });

  test('User does not pass a number for teamId', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    const res = await request(app).post('/api/v1/favorite-teams').send({ teamId: 'NAN' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch('Invalid team ID');
  });

  test('User passes an invalid number for teamId', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    const res = await request(app).post('/api/v1/favorite-teams').send({ teamId: -1 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch('Invalid team ID');
  });

  test('User has already favorited this team', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    await pool.query(`
      INSERT INTO users (user_id, google_id, access_token)
      VALUES (2, 'sample_google_token_2', 'sample_token_2')
      ON CONFLICT (user_id) DO NOTHING`
    );

    await pool.query(`
      INSERT INTO favorite_teams (user_id, team_id)
      VALUES (2, 101);`
    );

    const res = await request(app).post('/api/v1/favorite-teams').send({ teamId: 101 });
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch('This team is already a favorite for this user');
  });

  test('User has successfully favorited team.', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    await pool.query(`
      INSERT INTO users (user_id, google_id, access_token)
      VALUES (2, 'sample_google_token_2', 'sample_token_2')
      ON CONFLICT (user_id) DO NOTHING`
    );

    const res = await request(app).post('/api/v1/favorite-teams').send({ teamId: 101 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch('Favorite team added successfully');
    expect(res.body).toHaveProperty('favoriteTeam');
    expect(res.body.favoriteTeam.team_id).toBe(101);
  });
});

describe('DELETE: deleteFavoriteTeam', () => {
  test('This team is not currently favorited', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    await pool.query(`
      INSERT INTO users (user_id, google_id, access_token)
      VALUES (2, 'sample_google_token_2', 'sample_token_2')
      ON CONFLICT (user_id) DO NOTHING`
    );

    const res = await request(app).delete('/api/v1/favorite-teams').send({ teamId: 101 });
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch('Favorite team not found');
  });

  test('Team successfully deleted from favorites', async () => {
    mockAuth.setUser({ user_id: 2, google_id: 'sample_google_token_2', access_token: 'sample_token_2' });

    await pool.query(`
      INSERT INTO users (user_id, google_id, access_token)
      VALUES (2, 'sample_google_token_2', 'sample_token_2')
      ON CONFLICT (user_id) DO NOTHING`
    );

    await pool.query(`
      INSERT INTO favorite_teams (user_id, team_id)
      VALUES (2, 101);`
    );

    const res = await request(app).delete('/api/v1/favorite-teams').send({ teamId: 101 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch('Team has been successfully unfavorited.');
  });
});