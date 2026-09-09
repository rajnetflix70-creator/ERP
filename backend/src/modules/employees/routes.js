const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const SUPERVISOR_ROLES = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor', 'worker', 'employee', 'admin'];

// GET /api/v1/employees/roles — lookup for role dropdown (all authenticated)
router.get('/roles', ctrl.listRoles);

// GET /api/v1/employees — list all employees (all authenticated)
router.get('/', ctrl.listEmployees);

// GET /api/v1/employees/:id
router.get('/:id', ctrl.getEmployee);

// POST /api/v1/employees — create
router.post('/', requireRole(...SUPERVISOR_ROLES), ctrl.createEmployee);

// PUT /api/v1/employees/:id — update
router.put('/:id', requireRole(...SUPERVISOR_ROLES), ctrl.updateEmployee);

// DELETE /api/v1/employees/:id — soft deactivate
router.delete('/:id', requireRole(...SUPERVISOR_ROLES), ctrl.deactivateEmployee);

module.exports = router;
