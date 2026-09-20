const jwt = require('jsonwebtoken');
const config = require('../config/index');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, code: 'TOKEN_MISSING', message: 'Authentication token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, code: 'TOKEN_EXPIRED', message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ error: true, code: 'TOKEN_INVALID', message: 'Invalid or expired token' });
  }
};
