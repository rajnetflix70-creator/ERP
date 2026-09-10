const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  if (err.isJoi) {
    logger.warn(`Validation Error on ${req.method} ${req.originalUrl}: ${err.details[0]?.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
    });
    return res.status(400).json({
      error: true,
      message: err.details[0].message
    });
  }

  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    logger.warn(`Unauthorized access on ${req.method} ${req.originalUrl}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
    });
    return res.status(401).json({ error: true, message: err.message || 'Unauthorized' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${statusCode}] ${req.method} ${req.originalUrl} - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    statusCode,
    userId: req.user?.id,
    ip: req.ip || req.connection?.remoteAddress,
    stack: err.stack,
    detail: err.detail,
  });

  res.status(statusCode).json({ error: true, message, detail: err.detail || err.message });
};
