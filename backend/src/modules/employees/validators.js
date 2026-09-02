const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required()
    .messages({ 'string.empty': 'Full name is required' }),
  email: Joi.string().email().allow('', null).optional()
    .messages({ 'string.email': 'Please enter a valid email address' }),
  mobile_number: Joi.string().pattern(/^\+?[0-9\s\-]{7,18}$/).allow('', null).optional()
    .messages({ 'string.pattern.base': 'Please enter a valid mobile number (7-15 digits)' }),
  password: Joi.string().min(6).allow('', null).optional(),
  role_id: Joi.number().integer().required()
    .messages({ 'any.required': 'Please select an employee role' }),
  preferred_language: Joi.string().valid('en', 'ar', 'hi').default('en'),
  is_active: Joi.boolean().default(true),
});

const updateEmployeeSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().allow('', null).optional()
    .messages({ 'string.email': 'Please enter a valid email address' }),
  mobile_number: Joi.string().pattern(/^\+?[0-9\s\-]{7,18}$/).allow('', null).optional()
    .messages({ 'string.pattern.base': 'Please enter a valid mobile number' }),
  password: Joi.string().min(6).allow('', null).optional(),
  role_id: Joi.number().integer().optional(),
  preferred_language: Joi.string().valid('en', 'ar', 'hi').optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema };
