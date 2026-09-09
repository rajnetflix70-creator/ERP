const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

function getConnection() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_PUBLIC_URL;
  if (!dbUrl) {
    console.warn('⚠️ No DATABASE_URL found in environment variables. Set DATABASE_URL in Railway Variables tab.');
    return dbUrl;
  }
  if (isProduction) {
    return {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    };
  }
  return dbUrl;
}

const commonConfig = {
  client: 'pg',
  connection: getConnection(),
  migrations: {
    directory: path.join(__dirname, '../db/migrations')
  },
  seeds: {
    directory: path.join(__dirname, '../db/seeds')
  }
};

module.exports = {
  development: {
    ...commonConfig
  },
  test: {
    ...commonConfig,
    connection: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL + '_test'
  },
  production: {
    ...commonConfig,
    pool: { min: 2, max: 10 }
  }
};
