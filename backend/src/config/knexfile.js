const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const commonConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
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
