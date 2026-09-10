require('dotenv').config();
const app = require('./app');
const config = require('./config');
const db = require('./db');
const logger = require('./utils/logger');

const PORT = config.port;

async function startServer() {
  try {
    // Automatically run all latest migrations on production and development boot
    logger.info('Checking and running database migrations...');
    await db.migrate.latest({ directory: require('path').join(__dirname, 'db/migrations') });
    logger.info('Database migrations are up to date.');
  } catch (err) {
    logger.error('Failed to run database migrations on startup:', { error: err.message, stack: err.stack });
    console.error('Migration error on startup:', err);
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${config.env} mode`);
    console.log(`Server running on port ${PORT} in ${config.env} mode`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

startServer();
