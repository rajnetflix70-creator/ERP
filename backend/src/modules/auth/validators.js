const Joi = require('joi');

const register = Joi.object({
  full_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const otpRequest = Joi.object({
  mobile_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required()
});

const otpVerify = Joi.object({
  mobile_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required()
});

const googleAuth = Joi.object({
  idToken: Joi.string().required()
});

module.exports = {
  register,
  login,
  otpRequest,
  otpVerify,
  googleAuth
};
