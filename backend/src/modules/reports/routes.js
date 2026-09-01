const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ALL_ROLES = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor', 'equipment_manager'];

router.get('/dashboard', requireRole(...ALL_ROLES), ctrl.getDashboardStats);

module.exports = router;
