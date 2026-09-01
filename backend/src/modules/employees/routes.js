const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const SUPERVISOR_ROLES = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];

// GET /api/v1/employees/roles — lookup for role dropdown (all authenticated)
router.get('/roles', ctrl.listRoles);

// GET /api/v1/employees — list all employees (admin/supervisor can search)
router.get('/', requireRole(...SUPERVISOR_ROLES), ctrl.listEmployees);

// GET /api/v1/employees/:id
router.get('/:id', requireRole(...SUPERVISOR_ROLES), ctrl.getEmployee);

// POST /api/v1/employees — create
router.post('/', requireRole(...SUPERVISOR_ROLES), ctrl.createEmployee);

// PUT /api/v1/employees/:id — update
router.put('/:id', requireRole(...SUPERVISOR_ROLES), ctrl.updateEmployee);

// DELETE /api/v1/employees/:id — soft deactivate
router.delete('/:id', requireRole(...SUPERVISOR_ROLES), ctrl.deactivateEmployee);

module.exports = router;
