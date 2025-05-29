/*
  Database connection pool using the `pg` library.
*/
const { Pool } = require('pg');

const env = process.env.NODE_ENV || 'local';

const configs = {
  local: {
    user: process.env.LOCAL_PG_USER || 'postgres',
    host: process.env.LOCAL_PG_HOST || 'localhost',
    database: process.env.LOCAL_PG_DB || 'postgres',
    password: process.env.LOCAL_PG_PASSWORD || 'postgres',
    port: process.env.LOCAL_PG_PORT ? parseInt(process.env.LOCAL_PG_PORT) : 5432,
  },
  production: {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
    ssl: {
      rejectUnauthorized: false
    }
  },
  test: {
    user: 'postgres',
    host: 'localhost',
    database: 'matchday_backend_test',
    password: 'postgres',
    port: 5432,
  }
};

if (env === 'production') {
  if (!configs.production.user || !configs.production.password) {
    throw new Error("Missing required PG_USER or PG_PASSWORD in production environment");
  }
}

const pool = new Pool(configs[env]);

// Test the database connection
if (env !== 'test') {
  pool.connect()
    .then(client => {
      console.log('PostgreSQL database connection successful');
      client.release();
    })
    .catch(err => console.error('Database connection error:', err));
}
module.exports = pool; // exports the pool instance for use in database operations