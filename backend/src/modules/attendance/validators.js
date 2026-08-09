const Joi = require('joi');

const updateAttendance = Joi.object({
  status: Joi.string().valid('present', 'absent', 'half_day', 'on_leave'),
  remarks: Joi.string().allow('', null),
});

module.exports = {
  updateAttendance,
};
