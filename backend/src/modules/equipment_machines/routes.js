const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN = ['super_admin', 'company_admin'];
const SUPERVISOR = ['super_admin', 'company_admin', 'site_supervisor', 'project_manager', 'equipment_manager'];

router.get('/stats', ctrl.getStats);
router.get('/site-fleet', ctrl.getSiteFleet);
router.get('/calibration-summary', ctrl.getCalibrationSummary);
router.get('/daily-grid', ctrl.getDailyGrid);
router.post('/daily-log', requireRole(...SUPERVISOR), ctrl.updateDailyLog);

// ERP Extra Routes
router.get('/movements', ctrl.listMovements);
router.post('/movements', requireRole(...SUPERVISOR), ctrl.createMovement);
router.patch('/movements/:id/status', requireRole(...SUPERVISOR), ctrl.updateMovementStatus);

router.get('/maintenance', ctrl.listMaintenance);
router.post('/maintenance', requireRole(...SUPERVISOR), ctrl.createMaintenance);

router.get('/breakdowns', ctrl.listBreakdowns);
router.post('/breakdowns', requireRole(...SUPERVISOR), ctrl.createBreakdown);
router.patch('/breakdowns/:id', requireRole(...SUPERVISOR), ctrl.updateBreakdown);

router.get('/documents', ctrl.listDocuments);
router.post('/documents', requireRole(...SUPERVISOR), ctrl.createDocument);

router.get('/operators', ctrl.listOperators);
router.post('/operators', requireRole(...SUPERVISOR), ctrl.createOperator);

router.get('/vendors', ctrl.listVendors);
router.post('/vendors', requireRole(...SUPERVISOR), ctrl.createVendor);

router.get('/notifications', ctrl.listNotifications);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);

router.get('/reports', ctrl.getReportsData);

// Machine CRUD
router.get('/', ctrl.listMachines);
router.get('/:id', ctrl.getMachine);
router.post('/', requireRole(...SUPERVISOR), ctrl.createMachine);
router.put('/:id', requireRole(...SUPERVISOR), ctrl.updateMachine);
router.delete('/:id', requireRole(...ADMIN), ctrl.deleteMachine);

module.exports = router;
