const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ALL_ROLES = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor', 'equipment_manager'];
const ADMIN_ROLES = ['super_admin', 'company_admin', 'project_manager'];

router.get('/dashboard', requireRole(...ALL_ROLES), ctrl.getDashboardStats);
router.get('/audit-logs', requireRole(...ADMIN_ROLES), ctrl.getAuditLogs);
router.get('/audit-summary', requireRole(...ADMIN_ROLES), ctrl.getAuditSummary);

module.exports = router;
