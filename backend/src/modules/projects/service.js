const db = require('../../db');

async function listProjects(filters = {}) {
  let q = db('projects').orderBy([
    { column: 'status', order: 'asc' },
    { column: 'folder_no', order: 'asc' }
  ]);
  if (filters.status)  q = q.where('status', filters.status);
  if (filters.search)  q = q.whereILike('project_name', `%${filters.search}%`);
  if (filters.is_active !== undefined) q = q.where('is_active', filters.is_active);
  return q;
}

async function getProject(id) {
  const p = await db('projects').where({ id }).first();
  if (!p) { const e = new Error('Project not found'); e.statusCode = 404; throw e; }
  return p;
}

function sanitizeProjectData(data) {
  const allowed = [
    'folder_no', 'ak_job_no', 'project_name', 'area_sqft', 'emirate',
    'supervisor_names', 'supervisors_assigned', 'supervisors_required',
    'technicians_required', 'supervisors_available_march', 'status',
    'has_stressing_machine', 'has_onion_machine', 'has_gun_machine',
    'has_grouting_machine', 'notes', 'is_active'
  ];
  const clean = {};
  allowed.forEach(k => {
    if (data[k] !== undefined) clean[k] = data[k] === '' ? null : data[k];
  });
  return clean;
}

async function createProject(data) {
  const cleanData = sanitizeProjectData(data);
  if (!cleanData.project_name) cleanData.project_name = data.name || 'Untitled Project';
  const [p] = await db('projects').insert(cleanData).returning('*');
  return p;
}

async function updateProject(id, data) {
  const cleanData = sanitizeProjectData(data);
  const [p] = await db('projects').where({ id }).update(cleanData).returning('*');
  if (!p) { const e = new Error('Project not found'); e.statusCode = 404; throw e; }
  return p;
}

async function deleteProject(id) {
  const [p] = await db('projects').where({ id }).update({ is_active: false }).returning(['id', 'project_name', 'is_active']);
  if (!p) { const e = new Error('Project not found'); e.statusCode = 404; throw e; }
  return p;
}

async function getStats() {
  const rows = await db('projects').where('is_active', true)
    .select('status')
    .count('id as cnt')
    .groupBy('status');

  const stats = { total: 0, active: 0, needs_supervisor: 0, pending: 0, completed: 0, stopped: 0, grouting_pending: 0, strengthening: 0, supervisors_gap: 0 };
  rows.forEach(r => {
    const count = parseInt(r.cnt);
    stats.total += count;
    if (stats[r.status] !== undefined) stats[r.status] = count;
  });

  // Total supervisor gap
  const gap = await db('projects').where('is_active', true).sum('supervisors_required as gap');
  stats.supervisors_gap = parseInt(gap[0].gap) || 0;

  return stats;
}

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, getStats };
