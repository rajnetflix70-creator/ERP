const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const SUPERVISOR = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];
const ADMIN = ['super_admin', 'company_admin'];

router.get('/bulk-list', ctrl.getBulkList);
router.post('/bulk-submit', requireRole(...SUPERVISOR), ctrl.submitBulk);
router.get('/summary', ctrl.getSummary);

router.get('/labor-cost-summary', requireRole(...ADMIN), ctrl.getLaborCost);
router.get('/history/:userId', requireRole(...SUPERVISOR), ctrl.getHistory);
router.put('/wages/:userId', requireRole(...ADMIN), ctrl.setWages);
router.get('/export-excel', ctrl.exportExcel);

module.exports = router;
