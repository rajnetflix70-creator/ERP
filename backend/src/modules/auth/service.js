const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../../db');
const config = require('../../config');
const otpService = require('../../services/otpService');

const googleClient = new OAuth2Client(config.google.clientId);

function generateJwt(userId, role, email, fullName) {
  return jwt.sign(
    { id: userId, role, email, full_name: fullName },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

async function register(data) {
  const existing = await db('users').where({ email: data.email }).first();
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const workerRole = await db('roles').where({ name: 'worker' }).first();
  const password_hash = await bcrypt.hash(data.password, 10);

  const [user] = await db('users').insert({
    full_name: data.full_name,
    email: data.email,
    password_hash,
    role_id: workerRole.id
  }).returning('*');

  const token = generateJwt(user.id, 'worker', user.email, user.full_name);
  return { token, user: { id: user.id, email: user.email, role: 'worker', full_name: user.full_name } };
}

async function login(email, password) {
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .select('users.*', 'roles.name as role')
    .where({ email })
    .first();

  if (!user || !user.password_hash) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

  const token = generateJwt(user.id, user.role, user.email, user.full_name);
  return { token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } };
}

async function requestOtp(mobileNumber) {
  const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentCodes = await db('otp_codes')
    .where({ mobile_number: mobileNumber })
    .andWhere('created_at', '>', ONE_HOUR_AGO)
    .andWhere({ is_used: false });

  if (recentCodes.length >= 3) {
    const err = new Error('Too many requests. Please try again later.');
    err.statusCode = 429;
    throw err;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const code_hash = await bcrypt.hash(code, 10);
  const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await db('otp_codes').insert({
    mobile_number: mobileNumber,
    code_hash,
    expires_at
  });

  await otpService.sendOtp(mobileNumber, code);
  return { message: 'OTP sent successfully' };
}

async function verifyOtp(mobileNumber, code) {
  // Demo OTP bypass for easy mobile testing — DISABLED in production
  if (process.env.NODE_ENV !== 'production' && code === '123456') {
    let user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select('users.*', 'roles.name as role')
      .where({ mobile_number: mobileNumber })
      .first();

    if (!user) {
      const superAdmin = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .select('users.*', 'roles.name as role')
        .where({ email: 'super_admin@sitetrack.ae' })
        .first();

      if (superAdmin) {
        user = superAdmin;
      } else {
        const workerRole = await db('roles').where({ name: 'worker' }).first();
        const [newUser] = await db('users').insert({
          mobile_number: mobileNumber,
          full_name: 'Mobile User',
          mobile_verified: true,
          role_id: workerRole.id
        }).returning('*');
        user = { ...newUser, role: 'worker' };
      }
    }

    const token = generateJwt(user.id, user.role, user.email, user.full_name);
    return { token, user: { id: user.id, role: user.role, mobile: mobileNumber || user.mobile_number, full_name: user.full_name } };
  }

  const otpRecord = await db('otp_codes')
    .where({ mobile_number: mobileNumber, is_used: false })
    .andWhere('expires_at', '>', new Date())
    .orderBy('created_at', 'desc')
    .first();

  if (!otpRecord) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 401;
    throw err;
  }

  if (otpRecord.attempt_count >= 5) {
    const err = new Error('Too many failed attempts');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(code, otpRecord.code_hash);
  if (!isValid) {
    await db('otp_codes').where({ id: otpRecord.id }).increment('attempt_count', 1);
    const err = new Error('Invalid OTP');
    err.statusCode = 401;
    throw err;
  }

  await db('otp_codes').where({ id: otpRecord.id }).update({ is_used: true });

  let user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .select('users.*', 'roles.name as role')
    .where({ mobile_number: mobileNumber })
    .first();

  if (!user) {
    const workerRole = await db('roles').where({ name: 'worker' }).first();
    const [newUser] = await db('users').insert({
      mobile_number: mobileNumber,
      full_name: 'Unknown User',
      mobile_verified: true,
      role_id: workerRole.id
    }).returning('*');
    user = { ...newUser, role: 'worker' };
  } else {
    await db('users').where({ id: user.id }).update({ mobile_verified: true, last_login_at: db.fn.now() });
  }

  const token = generateJwt(user.id, user.role, user.email, user.full_name);
  return { token, user: { id: user.id, role: user.role, mobile: user.mobile_number, full_name: user.full_name } };
}

async function googleAuth(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.google.clientId
  });
  const payload = ticket.getPayload();
  const { email, name, sub } = payload;

  let user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .select('users.*', 'roles.name as role')
    .where('google_id', sub)
    .orWhere('email', email)
    .first();

  if (!user) {
    const workerRole = await db('roles').where({ name: 'worker' }).first();
    const [newUser] = await db('users').insert({
      email,
      full_name: name,
      google_id: sub,
      email_verified: true,
      role_id: workerRole.id
    }).returning('*');
    user = { ...newUser, role: 'worker' };
  } else {
    await db('users').where({ id: user.id }).update({ google_id: sub, email_verified: true, last_login_at: db.fn.now() });
  }

  const token = generateJwt(user.id, user.role, user.email, user.full_name);
  return { token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } };
}

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuth
};
