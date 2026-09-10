const service = require('./service');
const { logAudit } = require('../../services/auditService');

async function getBulkList(req, res, next) {
  try { res.json(await service.getBulkAttendanceList(req.query.date, req.query.project_id)); } catch(e) { next(e); }
}

async function submitBulk(req, res, next) {
  try {
    const result = await service.submitBulkAttendance(req.body, req.user?.id);
    logAudit({
      req,
      module: 'HR',
      action: 'SUBMIT_ATTENDANCE',
      details: `Submitted daily muster roll for date ${req.body.attendance_date || 'today'} (${req.body.records?.length || 0} records)`
    });
    res.json(result);
  } catch(e) { next(e); }
}

async function getSummary(req, res, next) {
  try { res.json(await service.getAttendanceSummary(req.query.date, req.query.project_id)); } catch(e) { next(e); }
}

async function getLaborCost(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    res.json(await service.getLaborCostSummary(month));
  } catch(e) { next(e); }
}

async function getHistory(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    res.json(await service.getAttendanceHistory(req.params.userId, month));
  } catch(e) { next(e); }
}

async function setWages(req, res, next) {
  try { res.json(await service.setEmployeeWages(req.params.userId, req.body)); } catch(e) { next(e); }
}

async function exportExcel(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const workbook = await service.generateExcelExport(date, req.query.project_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Attendance_${date}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
}

module.exports = { getBulkList, submitBulk, getSummary, getLaborCost, getHistory, setWages, exportExcel };
