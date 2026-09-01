const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

function getConnection() {
  if (!process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (isProduction) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }
  return process.env.DATABASE_URL;
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
