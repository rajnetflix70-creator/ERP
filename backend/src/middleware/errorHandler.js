const config = require('../config/index');

module.exports = (err, req, res, next) => {
  if (err.isJoi) {
    return res.status(400).json({
      error: true,
      message: err.details[0].message
    });
  }

  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    return res.status(401).json({ error: true, message: err.message || 'Unauthorized' });
  }

  console.error('[SERVER ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ error: true, message, detail: err.detail || err.message });
};
