const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN_ROLES = ['super_admin', 'company_admin'];

// GET /api/v1/employees/roles — lookup for role dropdown (all authenticated)
router.get('/roles', ctrl.listRoles);

// GET /api/v1/employees — list all employees (admin/supervisor can search)
router.get('/', requireRole('super_admin', 'company_admin', 'site_supervisor'), ctrl.listEmployees);

// GET /api/v1/employees/:id
router.get('/:id', requireRole('super_admin', 'company_admin', 'site_supervisor'), ctrl.getEmployee);

// POST /api/v1/employees — create (admin only)
router.post('/', requireRole(...ADMIN_ROLES), ctrl.createEmployee);

// PUT /api/v1/employees/:id — update (admin only)
router.put('/:id', requireRole(...ADMIN_ROLES), ctrl.updateEmployee);

// DELETE /api/v1/employees/:id — soft deactivate (admin only)
router.delete('/:id', requireRole(...ADMIN_ROLES), ctrl.deactivateEmployee);

module.exports = router;
