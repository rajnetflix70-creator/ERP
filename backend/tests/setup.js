require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || (process.env.DATABASE_URL + '_test');

const knex = require('knex');
const knexfile = require('../src/config/knexfile');

module.exports = async () => {
  const db = knex(knexfile.test);
  await db.migrate.rollback(null, true);
  await db.migrate.latest();
  await db.seed.run();
  await db.destroy();
};
