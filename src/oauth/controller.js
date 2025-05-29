/*
  Controller for authenticating users using Passport.js.
*/
const passport = require("../../config/passport");

const googleAuthRedirect = passport.authenticate("google", { scope: [
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar"]
});

const googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.error("Passport error:", err);
      return res.status(500).json({ error: "Authentication failed", details: err });
    }

    if (!user) {
      console.warn("No user returned by Passport");
      return res.status(401).json({ error: "User not authenticated" });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ error: "Login failed", details: loginErr });
      }

      return res.redirect("http://localhost:4200/");
    });
  })(req, res, next);
};

const checkUserLoggedIn = (req, res) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    return res.status(200).json({ isAuthenticated: true, user: req.session.passport.user });
  }
  return res.status(200).json({ isAuthenticated: false });
}

const logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    req.session.destroy((sessionErr) => {
      if (sessionErr) return res.status(500).json({ error: "Session destruction failed", details: sessionErr });

      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });
}

module.exports = {
  googleAuthRedirect,
  googleAuthCallback,
  checkUserLoggedIn,
  logout
};