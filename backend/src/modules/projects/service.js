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
    'has_grouting_machine', 'notes', 'is_active', 'client_name',
    'start_date', 'planned_end_date', 'actual_end_date', 'completion_pct',
    'priority', 'site_id', 'client_id', 'budget', 'currency', 'location'
  ];
  const clean = {};
  allowed.forEach(k => {
    if (data[k] !== undefined) clean[k] = data[k] === '' ? null : data[k];
  });
  if (data.name && !clean.project_name) clean.project_name = data.name;
  if (data.code) {
    if (!clean.folder_no) clean.folder_no = data.code;
    if (!clean.ak_job_no) clean.ak_job_no = data.code;
  }
  if (data.location && !clean.emirate) clean.emirate = data.location;
  if (clean.status && !['pending', 'active', 'needs_supervisor', 'completed', 'grouting_pending', 'stopped', 'strengthening'].includes(clean.status)) {
    // Map non-standard statuses safely if check constraint is still in effect
    if (clean.status === 'planning') clean.status = 'pending';
    else if (clean.status === 'in_progress') clean.status = 'active';
    else if (clean.status === 'on_hold') clean.status = 'stopped';
  }
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
