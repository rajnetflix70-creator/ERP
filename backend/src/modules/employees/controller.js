const service = require('./service');
const { createEmployeeSchema, updateEmployeeSchema } = require('./validators');
const { logAudit } = require('../../services/auditService');

async function listEmployees(req, res, next) {
  try {
    const filters = {
      role: req.query.role || null,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
      search: req.query.search || null,
    };
    const employees = await service.listEmployees(filters);
    res.json(employees);
  } catch (err) { next(err); }
}

async function getEmployee(req, res, next) {
  try {
    const employee = await service.getEmployee(req.params.id);
    res.json(employee);
  } catch (err) { next(err); }
}

async function createEmployee(req, res, next) {
  try {
    const { error, value } = createEmployeeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: true, message: error.details.map(d => d.message).join('; ') });
    }
    const employee = await service.createEmployee(value);
    logAudit({
      req,
      module: 'HR',
      action: 'CREATE_EMPLOYEE',
      entityId: employee.id,
      details: `Created employee record: ${employee.full_name} (${employee.email || employee.mobile_number})`
    });
    res.status(201).json(employee);
  } catch (err) { next(err); }
}

async function updateEmployee(req, res, next) {
  try {
    const { error, value } = updateEmployeeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: true, message: error.details.map(d => d.message).join('; ') });
    }
    const employee = await service.updateEmployee(req.params.id, value);
    logAudit({
      req,
      module: 'HR',
      action: 'UPDATE_EMPLOYEE',
      entityId: req.params.id,
      details: `Updated employee: ${employee.full_name} (Status: ${employee.is_active ? 'Active' : 'Inactive'})`
    });
    res.json(employee);
  } catch (err) { next(err); }
}

async function deactivateEmployee(req, res, next) {
  try {
    const result = await service.deactivateEmployee(req.params.id);
    logAudit({
      req,
      module: 'HR',
      action: 'DEACTIVATE_EMPLOYEE',
      entityId: req.params.id,
      details: `Deactivated employee ID: ${req.params.id}`
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function listRoles(req, res, next) {
  try {
    const roles = await service.listRoles();
    res.json(roles);
  } catch (err) { next(err); }
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deactivateEmployee, listRoles };
