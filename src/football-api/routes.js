/*
  Express router used to retrieve football information from FOOTBALL-API.
*/

const { Router } = require('express');
const controller = require('./controller');
const router = Router();
const isAuthenticated = require("../../middleware/authenticated.js");

router.get('/fixtures', isAuthenticated, controller.getTeamFixtures);
router.get('/teams', isAuthenticated, controller.searchForTeam );
router.get('/team/:teamId', isAuthenticated, controller.getTeamById);

module.exports = router;