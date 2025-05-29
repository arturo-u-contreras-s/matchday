/*
  Express router for managing users' favorite teams.
*/

const { Router } = require('express');
const controller = require('./controller');
const router = Router(); // Create router object
const isAuthenticated = require("../../middleware/authenticated.js");

/* Add routes to the Router object */
router.get('/', isAuthenticated, controller.getFavoriteTeams);
router.post('/', isAuthenticated, controller.addFavoriteTeam);
router.delete('/', isAuthenticated, controller.deleteFavoriteTeam);

module.exports = router; // Export the router for use