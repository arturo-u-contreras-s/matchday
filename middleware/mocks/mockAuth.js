/*
Simulate Passport.js behavior for a logged-in user
*/
let mockUser = {
  user_id: 1,
  google_id: "testuser",
  access_token: "test@example.com",
};

let authenticated = true;

const mockAuth = (req, res, next) => {
  req.isAuthenticated = () => authenticated;
  req.user = mockUser;
  next();
};

mockAuth.setUser = (user) => {
  mockUser = user;
};

mockAuth.setAuthenticated = (auth) => {
  authenticated = auth;
}

module.exports = mockAuth;
