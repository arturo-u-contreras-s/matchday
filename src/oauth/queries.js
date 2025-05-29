/*
  SQL queries for managing users.  
*/

const getUserById = `SELECT * FROM users WHERE user_id = $1;`;
const getUserByGoogleId = "SELECT * FROM users WHERE google_id = $1;";
const addUser = "INSERT INTO users (google_id, access_token) VALUES ($1, $2) RETURNING *;";
const updateUserTokens = 'UPDATE users SET access_token = $1 WHERE google_id = $2 RETURNING *;';

module.exports = {
  getUserById,
  getUserByGoogleId,
  addUser,
  updateUserTokens
};