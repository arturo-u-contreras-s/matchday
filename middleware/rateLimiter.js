/*
Rate Limiting Middleware
------------------------
This middleware limits the number of requests a client (identified by IP address) can make to a specific endpoint within a defined time window.

Functionality:
- Counts the number of recent requests from a given IP to a specific endpoint.
- If the number exceeds MAX_REQUESTS, it blocks the request with a 429 Too Many Requests response.
- Otherwise, it logs the request and allows it to proceed.
 */


const pool = require('../db');

const RATE_LIMIT_WINDOW_MS = 1 * 60 * 1000; // 1 minute window
const MAX_REQUESTS = 50;

const rateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const endpoint = req.path;
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  try {
    // Count recent requests from this IP and endpoint
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM rate_limits
       WHERE ip = $1 AND endpoint = $2 AND timestamp > $3`,
      [ip, endpoint, windowStart]
    );

    const requestCount = parseInt(rows[0].count, 10);

    if (requestCount >= MAX_REQUESTS) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
      });
    }

    // Log the current request
    await pool.query(
      `INSERT INTO rate_limits (ip, endpoint, timestamp)
       VALUES ($1, $2, $3)`,
      [ip, endpoint, now]
    );

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = rateLimiter;
