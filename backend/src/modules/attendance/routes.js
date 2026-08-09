const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const SUPERVISOR = ['super_admin', 'company_admin', 'site_supervisor'];

router.get('/bulk-list', ctrl.getBulkList);
router.post('/bulk-submit', requireRole(...SUPERVISOR), ctrl.submitBulk);
router.get('/summary', ctrl.getSummary);

module.exports = router;
