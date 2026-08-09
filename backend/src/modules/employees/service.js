const db = require('../../db');
const bcrypt = require('bcryptjs');

async function listEmployees(filters = {}) {
  let query = db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .leftJoin('site_assignments as sa', function () {
      this.on('sa.user_id', '=', 'users.id').andOnNull('sa.assigned_to');
    })
    .leftJoin('sites', 'sa.site_id', 'sites.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.mobile_number',
      'users.is_active',
      'users.preferred_language',
      'users.created_at',
      'users.last_login_at',
      'roles.name as role',
      'roles.id as role_id',
      'sites.name as site_name',
      'sites.id as site_id'
    )
    .orderBy('users.created_at', 'desc');

  if (filters.role) query = query.where('roles.name', filters.role);
  if (filters.is_active !== undefined) query = query.where('users.is_active', filters.is_active);
  if (filters.search) {
    query = query.where(function () {
      this.whereILike('users.full_name', `%${filters.search}%`)
        .orWhereILike('users.email', `%${filters.search}%`)
        .orWhereILike('users.mobile_number', `%${filters.search}%`);
    });
  }

  return query;
}

async function getEmployee(id) {
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', id)
    .select('users.*', 'roles.name as role')
    .first();

  if (!user) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  // Remove password hash from response
  delete user.password_hash;
  return user;
}

async function createEmployee(data) {
  const { full_name, email, mobile_number, role_id, password, preferred_language, is_active } = data;

  if (email) {
    const existing = await db('users').where({ email }).first();
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }
  }
  if (mobile_number) {
    const existing = await db('users').where({ mobile_number }).first();
    if (existing) {
      const err = new Error('Mobile number already registered');
      err.statusCode = 409;
      throw err;
    }
  }

  const password_hash = password ? await bcrypt.hash(password, 10) : null;

  const [user] = await db('users')
    .insert({
      full_name,
      email: email || null,
      mobile_number: mobile_number || null,
      role_id,
      password_hash,
      preferred_language: preferred_language || 'en',
      is_active: is_active !== undefined ? is_active : true,
      email_verified: !!email,
    })
    .returning(['id', 'full_name', 'email', 'mobile_number', 'is_active', 'preferred_language', 'created_at']);

  return user;
}

async function updateEmployee(id, data) {
  const { full_name, email, mobile_number, role_id, password, preferred_language, is_active } = data;

  const existing = await db('users').where({ id }).first();
  if (!existing) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }

  // Check uniqueness for email/mobile if changed
  if (email && email !== existing.email) {
    const dup = await db('users').where({ email }).whereNot({ id }).first();
    if (dup) {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }
  }
  if (mobile_number && mobile_number !== existing.mobile_number) {
    const dup = await db('users').where({ mobile_number }).whereNot({ id }).first();
    if (dup) {
      const err = new Error('Mobile number already in use');
      err.statusCode = 409;
      throw err;
    }
  }

  const updateData = {};
  if (full_name !== undefined) updateData.full_name = full_name;
  if (email !== undefined) updateData.email = email;
  if (mobile_number !== undefined) updateData.mobile_number = mobile_number;
  if (role_id !== undefined) updateData.role_id = role_id;
  if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (password) updateData.password_hash = await bcrypt.hash(password, 10);

  const [updated] = await db('users').where({ id }).update(updateData).returning([
    'id', 'full_name', 'email', 'mobile_number', 'is_active', 'preferred_language', 'role_id'
  ]);
  return updated;
}

async function deactivateEmployee(id) {
  const [updated] = await db('users').where({ id }).update({ is_active: false }).returning(['id', 'full_name', 'is_active']);
  if (!updated) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function listRoles() {
  return db('roles').select('id', 'name', 'description').orderBy('id');
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deactivateEmployee, listRoles };
