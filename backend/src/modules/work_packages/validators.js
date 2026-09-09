const Joi = require('joi');

const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked', 'delayed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const createWorkPackageSchema = Joi.object({
  project_id: Joi.string().uuid().required().messages({ 'any.required': 'Project is required' }),
  site_id: Joi.string().uuid().allow(null, '').optional(),
  title: Joi.string().min(2).max(200).required().messages({ 'string.empty': 'Task title is required' }),
  description: Joi.string().allow('', null).optional(),
  status: Joi.string().valid(...VALID_STATUSES).default('not_started'),
  priority: Joi.string().valid(...VALID_PRIORITIES).default('medium'),
  assigned_to: Joi.string().uuid().allow(null, '').optional(),
  planned_start: Joi.date().allow(null, '').optional(),
  planned_end: Joi.date().allow(null, '').optional(),
  completion_pct: Joi.number().min(0).max(100).default(0),
  blocked_reason: Joi.string().allow('', null).optional(),
});

const updateWorkPackageSchema = Joi.object({
  project_id: Joi.string().uuid().allow(null, '').optional(),
  site_id: Joi.string().uuid().allow(null, '').optional(),
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().allow('', null).optional(),
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  priority: Joi.string().valid(...VALID_PRIORITIES).optional(),
  assigned_to: Joi.string().uuid().allow(null, '').optional(),
  planned_start: Joi.date().allow(null, '').optional(),
  planned_end: Joi.date().allow(null, '').optional(),
  actual_start: Joi.date().allow(null, '').optional(),
  actual_end: Joi.date().allow(null, '').optional(),
  completion_pct: Joi.number().min(0).max(100).optional(),
  blocked_reason: Joi.string().allow('', null).optional(),
}).unknown(true);

const logProgressSchema = Joi.object({
  log_date: Joi.date().required().messages({ 'any.required': 'Log date is required' }),
  work_description: Joi.string().min(3).required().messages({ 'string.empty': 'Work description is required' }),
  qty_completed: Joi.number().min(0).allow(null).optional(),
  qty_unit: Joi.string().allow('', null).optional(),
  completion_pct: Joi.number().min(0).max(100).optional(),
  status_after: Joi.string().valid(...VALID_STATUSES).optional(),
  issues_encountered: Joi.string().allow('', null).optional(),
});

module.exports = { createWorkPackageSchema, updateWorkPackageSchema, logProgressSchema };
