/*
This module configures Passport.js to authenticate users using Google OAuth 2.0. 
*/

const CALLBACK_URL =
  process.env.NODE_ENV === "production"
    ? `${process.env.ALB_DNS}/api/v1/oauth/google/callback`
    : "http://localhost:3000/api/v1/oauth/google/callback";

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db");
const queries = require("../src/oauth/queries");
require("dotenv").config();
const encrypt = require('../utils/encrypt');

/*
Determines which user should be stored in the session after authentication.
- When a user logs in, Passport only saves a small piece of user info (the user_id)

- After login, Passport takes the user object from the database and stores the user_id in the session
*/
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

/*
Retrieves the full user object from the database using the stored user_id from the session
- The full user object is attached to req.user so it can be accessed in routes.
- Called on every request made by an authenticated user
*/
passport.deserializeUser(async (id, done) => {
  try {
    const userResult = await pool.query(queries.getUserById, [id]);
    if (userResult.rows.length === 0) {
      return done(null, false);
    }
    done(null, userResult.rows[0]); // Attach full user object to req.user
  } catch (error) {
    done(error, null);
  }
});

/*
Google OAuth using Passport.js
- Retrieves the users profile
- Checks if they exist in the db
- Stores OAuth tokens in the session
- Passes the User object to Passport
*/
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      passReqToCallback: true // passes req to the callback function below
    },
    async (req, accessToken, refreshToken, profile, done) => { // triggered after Google authenticates the user
      try {
        const googleId = profile.id;
        let userResult = await pool.query(queries.getUserByGoogleId, [googleId]); // Check if the user exists

        accessToken = encrypt.encryptToken(accessToken);

        if (userResult.rows.length === 0) { // Insert a new user if they do not exist
          const insertResult = await pool.query(queries.addUser, [googleId, accessToken]);
          userResult = insertResult;
        } else { // Update tokens if user already exists
          const updateResult = await pool.query(queries.updateUserTokens, [accessToken, googleId]);
          userResult = updateResult;
        }

        return done(null, userResult.rows[0]); // Pass the User object to Passport
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;