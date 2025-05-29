/*
  Middleware to handle requests to non-existent endpoints.
  Creates a 404 error and forwards it to the error handler.
*/

const notFound = (req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
};


module.exports = notFound;