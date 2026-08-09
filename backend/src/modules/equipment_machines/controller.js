const service = require('./service');
const erpExtra = require('./erpExtraService');

async function listMachines(req, res, next) {
  try {
    const filters = {
      machine_type: req.query.machine_type || null,
      status: req.query.status || null,
      search: req.query.search || null,
    };
    res.json(await service.listMachines(filters));
  } catch (e) { next(e); }
}

async function getMachine(req, res, next) {
  try { res.json(await service.getMachine(req.params.id)); } catch (e) { next(e); }
}

async function createMachine(req, res, next) {
  try { res.status(201).json(await service.createMachine(req.body)); } catch (e) { next(e); }
}

async function updateMachine(req, res, next) {
  try { res.json(await service.updateMachine(req.params.id, req.body)); } catch (e) { next(e); }
}

async function deleteMachine(req, res, next) {
  try { res.json(await service.deleteMachine(req.params.id)); } catch (e) { next(e); }
}

async function getDailyGrid(req, res, next) {
  try {
    const startDate = req.query.start_date || '2026-02-01';
    const endDate = req.query.end_date || '2026-02-21';
    const type = req.query.machine_type || null;
    res.json(await service.getDailyGrid(startDate, endDate, type));
  } catch (e) { next(e); }
}

async function updateDailyLog(req, res, next) {
  try {
    const { machine_id, log_date, location_name } = req.body;
    if (!machine_id || !log_date || !location_name) {
      return res.status(400).json({ error: true, message: 'machine_id, log_date, and location_name are required' });
    }
    res.json(await service.updateDailyLog(machine_id, log_date, location_name, req.user.id));
  } catch (e) { next(e); }
}

async function getSiteFleet(req, res, next) {
  try {
    const filters = {
      machine_type: req.query.machine_type || null,
      search: req.query.search || null,
    };
    res.json(await service.getSiteFleet(filters));
  } catch (e) { next(e); }
}

async function getCalibrationSummary(req, res, next) {
  try { res.json(await service.getCalibrationSummary()); } catch (e) { next(e); }
}

async function getStats(req, res, next) {
  try { res.json(await service.getStats()); } catch (e) { next(e); }
}

// --- ERP EXTRA CONTROLLERS ---
async function listMovements(req, res, next) {
  try { res.json(await erpExtra.listMovements(req.query)); } catch (e) { next(e); }
}
async function createMovement(req, res, next) {
  try { res.status(201).json(await erpExtra.createMovement({ ...req.body, requested_by: req.user.id })); } catch (e) { next(e); }
}
async function updateMovementStatus(req, res, next) {
  try { res.json(await erpExtra.updateMovementStatus(req.params.id, req.body.status, req.body.receiving_person)); } catch (e) { next(e); }
}

async function listMaintenance(req, res, next) {
  try { res.json(await erpExtra.listMaintenance(req.query)); } catch (e) { next(e); }
}
async function createMaintenance(req, res, next) {
  try { res.status(201).json(await erpExtra.createMaintenance(req.body)); } catch (e) { next(e); }
}

async function listBreakdowns(req, res, next) {
  try { res.json(await erpExtra.listBreakdowns(req.query)); } catch (e) { next(e); }
}
async function createBreakdown(req, res, next) {
  try { res.status(201).json(await erpExtra.createBreakdown(req.body)); } catch (e) { next(e); }
}
async function updateBreakdown(req, res, next) {
  try { res.json(await erpExtra.updateBreakdown(req.params.id, req.body)); } catch (e) { next(e); }
}

async function listDocuments(req, res, next) {
  try { res.json(await erpExtra.listDocuments(req.query)); } catch (e) { next(e); }
}
async function createDocument(req, res, next) {
  try { res.status(201).json(await erpExtra.createDocument(req.body)); } catch (e) { next(e); }
}

async function listOperators(req, res, next) {
  try { res.json(await erpExtra.listOperators()); } catch (e) { next(e); }
}
async function createOperator(req, res, next) {
  try { res.status(201).json(await erpExtra.createOperator(req.body)); } catch (e) { next(e); }
}

async function listVendors(req, res, next) {
  try { res.json(await erpExtra.listVendors()); } catch (e) { next(e); }
}
async function createVendor(req, res, next) {
  try { res.status(201).json(await erpExtra.createVendor(req.body)); } catch (e) { next(e); }
}

async function listNotifications(req, res, next) {
  try { res.json(await erpExtra.listNotifications()); } catch (e) { next(e); }
}
async function markNotificationRead(req, res, next) {
  try { res.json(await erpExtra.markNotificationRead(req.params.id)); } catch (e) { next(e); }
}

async function getReportsData(req, res, next) {
  try { res.json(await erpExtra.getReportsData()); } catch (e) { next(e); }
}

module.exports = {
  listMachines, getMachine, createMachine, updateMachine, deleteMachine,
  getDailyGrid, updateDailyLog, getSiteFleet, getCalibrationSummary, getStats,
  listMovements, createMovement, updateMovementStatus,
  listMaintenance, createMaintenance,
  listBreakdowns, createBreakdown, updateBreakdown,
  listDocuments, createDocument,
  listOperators, createOperator,
  listVendors, createVendor,
  listNotifications, markNotificationRead,
  getReportsData
};
