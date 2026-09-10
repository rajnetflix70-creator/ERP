const db = require('../../db');

async function listSites(user) {
  if (user.role === 'super_admin' || user.role === 'company_admin') {
    return db('sites').where({ is_active: true });
  } else {
    return db('sites')
      .join('site_assignments', 'sites.id', 'site_assignments.site_id')
      .where('site_assignments.user_id', user.id)
      .andWhere('sites.is_active', true)
      .select('sites.*');
  }
}

function sanitizeSiteData(data) {
  const allowed = [
    'name', 'code', 'emirate', 'address', 'latitude', 'longitude',
    'geofence_radius_meters', 'supervisor_id', 'is_active'
  ];
  const clean = {};
  allowed.forEach(k => {
    if (data[k] !== undefined) clean[k] = data[k] === '' ? null : data[k];
  });
  return clean;
}

async function createSite(data) {
  const siteCode = data.code || data.site_code || `S-${Date.now().toString().slice(-4)}`;
  const cleanData = sanitizeSiteData({
    ...data,
    code: siteCode,
    emirate: data.emirate || data.location || 'Dubai',
    latitude: data.latitude !== undefined && data.latitude !== null && data.latitude !== '' ? parseFloat(data.latitude) : 0,
    longitude: data.longitude !== undefined && data.longitude !== null && data.longitude !== '' ? parseFloat(data.longitude) : 0,
    geofence_radius_meters: parseInt(data.geofence_radius_meters || 300, 10),
  });

  const existing = await db('sites').where({ code: cleanData.code }).first();
  if (existing) {
    cleanData.code = `${cleanData.code}-${Date.now().toString().slice(-3)}`;
  }

  const [site] = await db('sites').insert(cleanData).returning('*');
  return site;
}

async function getSite(id) {
  const site = await db('sites').where({ id }).first();
  if (!site) {
    const err = new Error('Site not found');
    err.statusCode = 404;
    throw err;
  }
  if (site.supervisor_id) {
    site.supervisor = await db('users').select('id', 'full_name', 'email').where({ id: site.supervisor_id }).first();
  }
  return site;
}

async function updateSite(id, data) {
  const cleanData = sanitizeSiteData(data);
  const [updated] = await db('sites').where({ id }).update(cleanData).returning('*');
  if (!updated) {
    const err = new Error('Site not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function assignUser(siteId, userId, assignedFrom, assignedTo) {
  const [assignment] = await db('site_assignments').insert({
    site_id: siteId,
    user_id: userId,
    assigned_from: assignedFrom,
    assigned_to: assignedTo
  }).returning('*');
  return assignment;
}

async function listAssignments(siteId) {
  return db('site_assignments')
    .join('users', 'site_assignments.user_id', 'users.id')
    .join('roles', 'users.role_id', 'roles.id')
    .where('site_assignments.site_id', siteId)
    .select(
      'site_assignments.id',
      'site_assignments.assigned_from',
      'site_assignments.assigned_to',
      'users.id as user_id',
      'users.full_name',
      'users.email',
      'roles.name as role'
    );
}

module.exports = {
  listSites,
  createSite,
  getSite,
  updateSite,
  assignUser,
  listAssignments
};
