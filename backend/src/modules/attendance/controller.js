const service = require('./service');

async function getBulkList(req, res, next) {
  try {
    const date = req.query.date || null;
    res.json(await service.getBulkAttendanceList(date));
  } catch (e) { next(e); }
}

async function submitBulk(req, res, next) {
  try {
    res.json(await service.submitBulkAttendance(req.body, req.user.id));
  } catch (e) { next(e); }
}

async function getSummary(req, res, next) {
  try {
    const date = req.query.date || null;
    res.json(await service.getAttendanceSummary(date));
  } catch (e) { next(e); }
}

module.exports = {
  getBulkList,
  submitBulk,
  getSummary,
};
