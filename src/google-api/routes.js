/*
  Express router for managing the users google calendar.
*/
const { Router } = require('express');
const controller = require('./controller.js');
const router = Router();
const isAuthenticated = require("../../middleware/authenticated.js");

router.post("/calendar", isAuthenticated, controller.addEventToGoogleCalendar);
router.get("/profile", isAuthenticated, controller.getGoogleProfile);
router.post("/check-fixtures", isAuthenticated, controller.checkEventsInGoogleCalendar);

module.exports = router;