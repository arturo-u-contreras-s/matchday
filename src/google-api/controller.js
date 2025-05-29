/*
  Controller for getting the users Google info and managing their Calendar.
*/
const { google } = require("googleapis");
const encrypt = require('../../utils/encrypt');

/*
eventDetails: {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string
}
*/
const addEventToGoogleCalendar = async (req, res) => {
  const { summary, description, startDateTime, endDateTime, gameId } = req.body.eventDetails || {};
  if (!summary || !description || !startDateTime || !endDateTime || !gameId) {
    return res.status(400).json({ message: "Invalid Event Details" });
  }

  const accessToken = encrypt.decryptToken(req.user.access_token);
  if (!accessToken) {
    return res.status(403).json({ message: "No Google access token found" });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'UTC',
      },
      extendedProperties: {
        private: {
          appSource: "matchday",
          gameId: gameId.toString()
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.status(200).json({ message: "Event added to calendar", fixture: response.data.summary });
  } catch (error) {
    console.error("Google Calendar API Error:", error);
    res.status(500).json({ message: "Failed to create event", error: error.message });
  }
};

const getGoogleProfile = async (req, res) => {
  const accessToken = encrypt.decryptToken(req.user.access_token);
  if (!accessToken) {
    return res.status(403).json({ message: "No Google access token found" });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const people = google.people({ version: 'v1', auth });

    const response = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses',
    });

    const profile = response.data;

    const name = profile.names?.[0]?.displayName || "Unknown";
    const email = profile.emailAddresses?.[0]?.value || "No email found";

    res.status(200).json({ name, email });
  } catch (error) {
    console.error("Failed to fetch Google profile:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

const checkEventsInGoogleCalendar = async (req, res) => {
  const { gameIds } = req.body;

  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    return res.status(400).json({ message: "gameIds must be a non-empty array" });
  }

  const accessToken = encrypt.decryptToken(req.user.access_token);
  if (!accessToken) {
    return res.status(403).json({ message: "No Google access token found" });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });
    const foundGameIds = [];

    for (const gameId of gameIds) {
      const result = await calendar.events.list({
        calendarId: "primary",
        privateExtendedProperty: `gameId=${gameId}`
      });

      if (result.data.items && result.data.items.length > 0) {
        foundGameIds.push(gameId);
      }
    }

    res.status(200).json({
      foundGameIds,
      missingGameIds: gameIds.filter(id => !foundGameIds.includes(id))
    });
  } catch (error) {
    console.error("Error checking events in calendar:", error);
    res.status(500).json({ message: "Failed to check events", error: error.message });
  }
};


module.exports = {
  addEventToGoogleCalendar,
  getGoogleProfile,
  checkEventsInGoogleCalendar
};