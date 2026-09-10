const Joi = require('joi');

const createSite = Joi.object({
  name: Joi.string().required().messages({ 'string.empty': 'Site name is required' }),
  code: Joi.string().allow('', null).optional(),
  site_code: Joi.string().allow('', null).optional(),
  emirate: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  location: Joi.string().allow('', null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null, '').optional().default(0),
  longitude: Joi.number().min(-180).max(180).allow(null, '').optional().default(0),
  geofence_radius_meters: Joi.number().integer().min(10).allow(null).optional().default(300),
  supervisor_id: Joi.string().uuid().allow(null, '').optional(),
  project_id: Joi.string().uuid().allow(null, '').optional(),
}).unknown(true);

const updateSite = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  emirate: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  location: Joi.string().allow('', null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null, '').optional(),
  longitude: Joi.number().min(-180).max(180).allow(null, '').optional(),
  geofence_radius_meters: Joi.number().integer().min(10).allow(null).optional(),
  supervisor_id: Joi.string().uuid().allow(null, '').optional(),
  project_id: Joi.string().uuid().allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
}).unknown(true);

const assignUser = Joi.object({
  user_id: Joi.string().uuid().required(),
  assigned_from: Joi.date().iso().required(),
  assigned_to: Joi.date().iso().allow(null)
});

module.exports = {
  createSite,
  updateSite,
  assignUser
};
