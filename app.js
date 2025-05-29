const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./db");
const passport = require("./config/passport");
require("dotenv").config();

const logger = require("./middleware/logger.js");
const notFound = require("./middleware/notFound.js");
const errorHandler = require("./middleware/error.js");
const rateLimiter = require("./middleware/rateLimiter.js");

const favoriteTeamsRoutes = require("./src/favorite-teams/routes");
const oauthRoutes = require("./src/oauth/routes");
const googleApiRoutes = require("./src/google-api/routes.js");
const footballApiRoutes = require("./src/football-api/routes.js");

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json());

app.use(
  session({
    store: new pgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 10,
    },
  })
);

if (process.env.NODE_ENV === "test") {
  console.log("Using mock authentication for testing");
  app.use(require("./middleware/mocks/mockAuth.js"));
} else {
  /* Initialize Passport.js */
  app.use(passport.initialize());
  app.use(passport.session());
}

app.use(logger);
app.use(rateLimiter);

// Health route that AWS ALB hits
app.get("/api/v1/health", (req, res) => {
  res.sendStatus(200);
});
app.use("/api/v1/favorite-teams", favoriteTeamsRoutes);
app.use("/api/v1/oauth", oauthRoutes);
app.use("/api/v1/google-api", googleApiRoutes);
app.use("/api/v1/football-api", footballApiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;