/*
  Controller for managing users' favorite teams.
*/

const pool = require('../../db');
const queries = require('./queries');

const getFavoriteTeams = async (req, res, next) => {
  const user = req.user;

  try {
    const results = await pool.query(queries.getFavoriteTeamsByUserId, [user.user_id]);
    res.status(200).json(results.rows.map(row => row.team_id));
  } catch (error) {
    console.error("Error fetching favorite teams by user id:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const addFavoriteTeam = async (req, res, next) => {
  const user = req.user;

  if (!req.body.teamId) {
    return res.status(400).json({ error: "Missing teamId in request body" });
  }
  const teamId = parseInt(req.body.teamId, 10);
  /* Check that the team id is a number */
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({ error: "Invalid team ID" });
  }

  try {
    /* Check if the team is already favorited */
    const existingFavorite = await pool.query(queries.getFavoriteTeam, [user.user_id, teamId]);
    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({ error: "This team is already a favorite for this user" });
    }

    /* Insert the favorite team */
    const insertResult = await pool.query(queries.addFavoriteTeam, [user.user_id, teamId]);
    res.status(201).json({
      message: "Favorite team added successfully",
      favoriteTeam: insertResult.rows[0],
    });
  } catch (error) {
    console.error("Error adding favorite team:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteFavoriteTeam = async (req, res, next) => {
  const user = req.user;

  if (!req.body.teamId) {
    return res.status(400).json({ error: "Missing teamId in request body" });
  }
  const teamId = parseInt(req.body.teamId, 10);
  /* Check that the team id is a number */
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({ error: "Invalid team ID" });
  }

  try {
    /* Check if the favorite team exists before deleting */
    const favoriteCheckResult = await pool.query(queries.getFavoriteTeam, [user.user_id, teamId]);
    if (favoriteCheckResult.rows.length === 0) {
      return res.status(404).json({ error: "Favorite team not found" });
    }

    /* Delete the currently favorited team */
    await pool.query(queries.deleteFavoriteTeam, [user.user_id, teamId]);
    res.status(200).json({ message: "Team has been successfully unfavorited." });
  } catch (error) {
    console.error("Error deleting favorite team:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getFavoriteTeams,
  addFavoriteTeam,
  deleteFavoriteTeam,
};