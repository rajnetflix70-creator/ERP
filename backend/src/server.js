require('dotenv').config();
const app = require('./app');
const config = require('./config');
const db = require('./db');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT || config.port || '3001', 10);

async function startServer() {
  // 1. Immediately bind and listen on PORT for Railway healthcheck
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT} in ${config.env} mode`);
    console.log(`Server running on port ${PORT} in ${config.env} mode`);
    console.log(`Health check: http://0.0.0.0:${PORT}/api/v1/health`);
  });

  // 2. Run database migrations in background without blocking healthcheck
  try {
    logger.info('Checking and running database migrations...');
    await db.migrate.latest({ directory: require('path').join(__dirname, 'db/migrations') });
    logger.info('Database migrations are up to date.');
  } catch (err) {
    logger.error('Database migration note on startup:', { error: err.message });
    console.warn('Database migration note:', err.message);
  }
}

startServer();
