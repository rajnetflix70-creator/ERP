const Joi = require('joi');

const CATEGORIES = ['Cement', 'Steel', 'Cables', 'Grouting', 'Chemical', 'Hardware', 'Timber', 'PVC', 'Other'];
const UNITS = ['bags', 'kg', 'ton', 'm', 'sqft', 'litre', 'nos', 'rolls', 'sheets', 'boxes', 'sets'];
const PRIORITIES = ['urgent', 'normal', 'low'];

const createMaterialSchema = Joi.object({
  material_code: Joi.string().max(50).required().messages({ 'string.empty': 'Material code is required' }),
  name: Joi.string().min(2).max(200).required().messages({ 'string.empty': 'Material name is required' }),
  unit_of_measure: Joi.string().valid(...UNITS).required(),
  category: Joi.string().valid(...CATEGORIES).required(),
  standard_rate: Joi.number().min(0).default(0),
  description: Joi.string().allow('', null).optional(),
  reorder_level: Joi.number().min(0).default(0),
  is_active: Joi.boolean().default(true),
}).unknown(true);

const updateMaterialSchema = Joi.object({
  material_code: Joi.string().max(50).optional(),
  name: Joi.string().min(2).max(200).optional(),
  unit_of_measure: Joi.string().valid(...UNITS).optional(),
  category: Joi.string().valid(...CATEGORIES).optional(),
  standard_rate: Joi.number().min(0).optional(),
  description: Joi.string().allow('', null).optional(),
  reorder_level: Joi.number().min(0).optional(),
  is_active: Joi.boolean().optional(),
}).unknown(true);

const createRequestSchema = Joi.object({
  project_id: Joi.string().uuid().required().messages({ 'any.required': 'Project is required' }),
  site_id: Joi.string().uuid().allow(null, '').optional(),
  material_id: Joi.string().uuid().required().messages({ 'any.required': 'Material is required' }),
  qty_requested: Joi.number().positive().required().messages({ 'any.required': 'Quantity required' }),
  date_needed: Joi.date().allow(null, '').optional(),
  purpose: Joi.string().allow('', null).optional(),
  priority: Joi.string().valid(...PRIORITIES).default('normal'),
}).unknown(true);

const approveRequestSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'cancelled').required(),
  approval_notes: Joi.string().allow('', null).optional(),
}).unknown(true);

const issueRequestSchema = Joi.object({
  qty_issued: Joi.number().positive().required(),
  notes: Joi.string().allow('', null).optional(),
}).unknown(true);

const consumptionSchema = Joi.object({
  material_id: Joi.string().uuid().required(),
  project_id: Joi.string().uuid().required(),
  site_id: Joi.string().uuid().allow(null, '').optional(),
  work_package_id: Joi.string().uuid().allow(null, '').optional(),
  material_request_id: Joi.string().uuid().allow(null, '').optional(),
  qty_consumed: Joi.number().positive().required(),
  consumption_date: Joi.date().required(),
  notes: Joi.string().allow('', null).optional(),
}).unknown(true);

module.exports = { createMaterialSchema, updateMaterialSchema, createRequestSchema, approveRequestSchema, issueRequestSchema, consumptionSchema };
