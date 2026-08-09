const config = require('../config/index');
const knexfile = require('../config/knexfile');

const environment = config.env === 'test' ? 'test' : (config.env === 'production' ? 'production' : 'development');
const db = require('knex')(knexfile[environment]);

module.exports = db;
