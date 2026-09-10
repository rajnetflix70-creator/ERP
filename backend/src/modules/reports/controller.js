const service = require('./service');
const auditService = require('../../services/auditService');

async function getDashboardStats(req, res, next) {
  try {
    res.json(await service.getDashboardStats());
  } catch(e) {
    next(e);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const data = await auditService.getAuditLogs(req.query);
    res.json(data);
  } catch(e) {
    next(e);
  }
}

async function getAuditSummary(req, res, next) {
  try {
    const data = await auditService.getAuditSummary();
    res.json(data);
  } catch(e) {
    next(e);
  }
}

module.exports = {
  getDashboardStats,
  getAuditLogs,
  getAuditSummary
};
