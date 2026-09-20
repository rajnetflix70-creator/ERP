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
      code: 'VALIDATION_ERROR',
      message: err.details[0]?.message || 'Validation failed',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    logger.warn(`Unauthorized access on ${req.method} ${req.originalUrl}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
    });
    return res.status(401).json({ error: true, code: 'UNAUTHORIZED', message: err.message || 'Unauthorized' });
  }

  // Database Connection or Query Errors
  const isDbConnectionError = err.code === 'ECONNREFUSED' || 
    err.code === 'ETIMEDOUT' || 
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    (err.message && (err.message.includes('Knex: Timeout') || err.message.includes('Connection terminated') || err.message.includes('connect ECONNREFUSED')));

  if (isDbConnectionError) {
    logger.error(`[503 DB ERROR] ${req.method} ${req.originalUrl} - ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      code: err.code,
      stack: err.stack
    });
    return res.status(503).json({
      error: true,
      code: 'DB_CONNECTION_ERROR',
      message: 'Database server is currently unavailable. Please try again shortly.'
    });
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

  res.status(statusCode).json({ error: true, code: err.code || 'INTERNAL_ERROR', message, detail: err.detail || err.message });
};

