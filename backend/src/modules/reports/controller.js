const service = require('./service');

async function getDashboardStats(req, res, next) {
  try {
    res.json(await service.getDashboardStats());
  } catch(e) {
    next(e);
  }
}

module.exports = {
  getDashboardStats
};
