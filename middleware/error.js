/*
  Global error handling middleware.  
  Sends a JSON response with the appropriate status code and error message.  
  - If the error has a status code, it is used in the response.  
  - Otherwise, a generic 500 Internal Server Error is returned.
*/

const errorHandler = (err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error' })
};

module.exports = errorHandler;