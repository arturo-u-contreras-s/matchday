/*
  Controller used to call FOOTBALL API for team and fixture data.
*/

const fetch = require('node-fetch');
require('dotenv').config();

const baseUrl = 'https://v3.football.api-sports.io/';
const apiKey = process.env.FOOTBALL_API_KEY;

/*
  Get fixtures for a specific team during a specific season
  Query params: teamId, season
*/
const getTeamFixtures = async (req, res) => {
  const { teamId, season } = req.query;

  if (!teamId || !season) {
    let errors = ["Query parameters required: team, season"];
    return res.status(400).json({ errors: errors });
  }

  try {
    const response = await fetch(`${baseUrl}fixtures?team=${teamId}&season=${season}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey
      }
    });

    const body = await response.text();

    res.status(response.status);

    try {
      res.json(JSON.parse(body));
    } catch {
      res.send(body);
    }
  } catch (error) {
    let errors = [error.message];
    res.status(500).json({ message: "Internal proxy error", errors: errors });
  }
};

/*
  Search for a team by name
  Query param: search
*/
const searchForTeam = async (req, res) => {
  const { search } = req.query;

  if (!search) {
    let errors = ["Missing required query parameter: search"];
    return res.status(400).json({ errors: errors });
  }

  try {
    const response = await fetch(`${baseUrl}teams?search=${encodeURIComponent(search)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey
      }
    });

    const body = await response.text();

    res.status(response.status);

    try {
      res.json(JSON.parse(body));
    } catch {
      res.send(body);
    }
  } catch (error) {
    console.error("Failed to proxy team search:", error);
    let errors = [error.message];
    res.status(500).json({ message: "Internal proxy error", errors: errors });
  }
};


/*
  Get a team by its ID
  Route param: teamId
*/
const getTeamById = async (req, res) => {
  const { teamId } = req.params;

  if (!teamId) {
    let errors = ["Missing required path parameter: teamId"];
    return res.status(400).json({ errors: errors });
  }

  try {
    const response = await fetch(`${baseUrl}teams?id=${teamId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey
      }
    });

    const body = await response.text();

    res.status(response.status);

    try {
      res.json(JSON.parse(body));
    } catch {
      res.send(body);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    let errors = [error.message];
    res.status(500).json({ message: "Internal proxy error", errors: errors });
  }
};


module.exports = {
  getTeamFixtures,
  searchForTeam,
  getTeamById,
};
