/*
  Logs the HTTP method, protocol, host, and full URL of incoming requests.  
*/

const logger = (req, res, next) => {
  console.log(
    `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`
  );
  next(); // pass control to the next middleware
};

module.exports = logger;