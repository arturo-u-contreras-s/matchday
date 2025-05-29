/*
This middleware checks if the user is authenticated before allowing access to protected routes.
- Uses `req.isAuthenticated()` (provided by Passport.js) to verify if the user is logged in.
- If authenticated, the request proceeds to the next middleware/controller.
- If not authenticated, it returns a `401 Unauthorized` response with a JSON error message.

Usage:
- Apply this middleware to routes that require authentication.
*/

const authenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized: Please log in" });
};

module.exports = authenticated;