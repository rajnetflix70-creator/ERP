const Joi = require('joi');

const createSite = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  emirate: Joi.string().valid('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah').required(),
  address: Joi.string().allow('', null),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  geofence_radius_meters: Joi.number().integer().min(10).default(300),
  supervisor_id: Joi.string().uuid().allow(null)
});

const updateSite = Joi.object({
  name: Joi.string(),
  code: Joi.string(),
  emirate: Joi.string().valid('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'),
  address: Joi.string().allow('', null),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  geofence_radius_meters: Joi.number().integer().min(10),
  supervisor_id: Joi.string().uuid().allow(null),
  is_active: Joi.boolean()
});

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
