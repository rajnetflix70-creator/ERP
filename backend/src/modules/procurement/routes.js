const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const SUPERVISOR = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];
const ADMIN = ['super_admin', 'company_admin'];

// PR Routes
router.get('/pr', requireRole(...SUPERVISOR), ctrl.getPRs);
router.post('/pr', requireRole(...SUPERVISOR), ctrl.createPR);
router.put('/pr/:id/approve', requireRole(...ADMIN), ctrl.approvePR);

// PO Routes
router.get('/po', requireRole(...ADMIN), ctrl.getPOs);
router.post('/po', requireRole(...ADMIN), ctrl.createPO);
router.put('/po/:id/status', requireRole(...ADMIN), ctrl.updatePOStatus);

// GRN Routes
router.get('/grn', requireRole(...SUPERVISOR), ctrl.getGRNs);
router.post('/grn', requireRole(...SUPERVISOR), ctrl.createGRN);

module.exports = router;
