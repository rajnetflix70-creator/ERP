const service = require('./service');
const validators = require('./validators');
const { logAudit } = require('../../services/auditService');

async function register(req, res, next) {
  try {
    const value = await validators.register.validateAsync(req.body);
    const result = await service.register(value);
    
    logAudit({
      req,
      userId: result.user?.id,
      userName: result.user?.full_name,
      userRole: result.user?.role,
      module: 'AUTH',
      action: 'USER_REGISTERED',
      details: `New account registered: ${result.user?.email}`
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const value = await validators.login.validateAsync(req.body);
    const result = await service.login(value.email, value.password);
    
    logAudit({
      req,
      userId: result.user?.id,
      userName: result.user?.full_name,
      userRole: result.user?.role,
      module: 'AUTH',
      action: 'LOGIN_SUCCESS',
      details: `User logged in successfully (${result.user?.email})`
    });

    res.json(result);
  } catch (err) {
    logAudit({
      req,
      userName: req.body?.email || 'Unknown',
      module: 'AUTH',
      action: 'LOGIN_FAILED',
      status: 'FAILURE',
      details: `Failed login attempt for ${req.body?.email || 'unknown'}: ${err.message}`
    });
    next(err);
  }
}

async function requestOtp(req, res, next) {
  try {
    const value = await validators.otpRequest.validateAsync(req.body);
    const result = await service.requestOtp(value.mobile_number);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const value = await validators.otpVerify.validateAsync(req.body);
    const result = await service.verifyOtp(value.mobile_number, value.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const value = await validators.googleAuth.validateAsync(req.body);
    const result = await service.googleAuth(value.idToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuth,
  getMe
};
