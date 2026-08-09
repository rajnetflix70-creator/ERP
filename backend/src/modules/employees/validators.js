const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().allow('', null).optional(),
  mobile_number: Joi.string().pattern(/^\+[1-9]\d{7,14}$/).allow('', null).optional()
    .messages({ 'string.pattern.base': 'Mobile number must be in E.164 format e.g. +971501234567' }),
  password: Joi.string().min(6).allow('', null).optional(),
  role_id: Joi.number().integer().required(),
  preferred_language: Joi.string().valid('en', 'ar', 'hi').default('en'),
  is_active: Joi.boolean().default(true),
}).or('email', 'mobile_number');

const updateEmployeeSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().allow('', null).optional(),
  mobile_number: Joi.string().pattern(/^\+[1-9]\d{7,14}$/).allow('', null).optional(),
  password: Joi.string().min(6).allow('', null).optional(),
  role_id: Joi.number().integer().optional(),
  preferred_language: Joi.string().valid('en', 'ar', 'hi').optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema };
