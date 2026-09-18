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
    'supervisor_names', 'manager', 'engineer', 'lead_engineer',
    'supervisors_assigned', 'supervisors_required',
    'technicians_required', 'supervisors_available_march', 'status',
    'has_stressing_machine', 'has_onion_machine', 'has_gun_machine',
    'has_grouting_machine', 'notes', 'is_active', 'client_name',
    'start_date', 'planned_end_date', 'actual_end_date', 'completion_pct',
    'priority', 'site_id', 'client_id', 'budget', 'currency', 'location',
    'plot_no', 'job_division', 'tender_net_area', 'actual_project_area',
    'slab_scope_description', 'total_slabs_count', 'pm_lead', 'pm_user_id',
    'engineer_user_id', 'running_count', 'expected_start_date', 'expected_completion_date'
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
  if (data.manager && !clean.supervisor_names) clean.supervisor_names = data.manager;
  if (data.supervisor_names && !clean.manager) clean.manager = data.supervisor_names;
  if (data.engineer && !clean.lead_engineer) clean.lead_engineer = data.engineer;
  if (data.lead_engineer && !clean.engineer) clean.engineer = data.lead_engineer;
  if (data.startDate && !clean.start_date) clean.start_date = data.startDate;
  if (data.expectedCompletion && !clean.planned_end_date) clean.planned_end_date = data.expectedCompletion;
  if (data.progress !== undefined && clean.completion_pct === undefined) clean.completion_pct = Number(data.progress) || 0;
  if (clean.budget !== undefined && clean.budget !== null) {
    clean.budget = Number(String(clean.budget).replace(/[^0-9.-]+/g, '')) || 0;
  }
  if (!clean.currency) clean.currency = 'AED';
  if (data.location && !clean.emirate) clean.emirate = data.location;
  if (clean.status && !['pending', 'active', 'needs_supervisor', 'completed', 'grouting_pending', 'stopped', 'strengthening'].includes(clean.status)) {
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

  const gap = await db('projects').where('is_active', true).sum('supervisors_required as gap');
  stats.supervisors_gap = parseInt(gap[0].gap) || 0;

  return stats;
}

/* ── PT Sub-Resource Methods ── */

async function getProjectWithDetails(id) {
  const project = await getProject(id);
  const [slabs, supervisors, drawings, commercials] = await Promise.all([
    db('project_slabs').where({ project_id: id }).orderBy('floor_order', 'asc'),
    db('project_supervisors').where({ project_id: id }),
    db('project_drawings').where({ project_id: id }).orderBy('created_at', 'desc'),
    db('project_commercials').where({ project_id: id }).first(),
  ]);
  return {
    ...project,
    slabs: slabs || [],
    supervisors: supervisors || [],
    drawings: drawings || [],
    commercials: commercials || null,
  };
}

async function getSlabs(projectId) {
  return db('project_slabs').where({ project_id: projectId }).orderBy('floor_order', 'asc');
}

async function upsertSlab(projectId, slabData) {
  const payload = {
    project_id: projectId,
    floor_name: slabData.floor_name || 'Floor',
    floor_order: Number(slabData.floor_order) || 1,
    area_sqft: slabData.area_sqft !== undefined ? Number(slabData.area_sqft) : 0,
    material_po_status: slabData.material_po_status || 'pending',
    material_site_status: slabData.material_site_status || 'pending',
    strand_cutting_status: slabData.strand_cutting_status || 'to_do',
    laying_status: slabData.laying_status || 'to_do',
    top_steel_status: slabData.top_steel_status || 'pending',
    concreting_status: slabData.concreting_status || 'scheduled',
    concreted_at: slabData.concreted_at ? new Date(slabData.concreted_at) : null,
    stressing_prep_status: slabData.stressing_prep_status || 'pending',
    stressing_status: slabData.stressing_status || 'pending',
    stressing_report_status: slabData.stressing_report_status || 'report_balance',
    stressing_date: slabData.stressing_date ? new Date(slabData.stressing_date) : null,
    grouting_status: slabData.grouting_status || 'pending',
    grouting_date: slabData.grouting_date ? new Date(slabData.grouting_date) : null,
    remarks: slabData.remarks || null,
  };

  if (slabData.id) {
    const [updated] = await db('project_slabs').where({ id: slabData.id, project_id: projectId }).update(payload).returning('*');
    return updated;
  } else {
    const [inserted] = await db('project_slabs').insert(payload).returning('*');
    return inserted;
  }
}

async function batchUpdateSlabs(projectId, slabsArray) {
  if (!Array.isArray(slabsArray)) return [];
  const results = [];
  for (const slab of slabsArray) {
    const res = await upsertSlab(projectId, slab);
    results.push(res);
  }
  return results;
}

async function deleteSlab(projectId, slabId) {
  return db('project_slabs').where({ id: slabId, project_id: projectId }).del();
}

async function getDrawings(projectId) {
  return db('project_drawings').where({ project_id: projectId }).orderBy('created_at', 'desc');
}

async function createDrawing(projectId, drawingData) {
  const payload = {
    project_id: projectId,
    drawing_type: drawingData.drawing_type || 'as_built',
    level_name: drawingData.level_name || 'All Levels',
    submission_status: drawingData.submission_status || 'to_do',
    submission_date: drawingData.submission_date ? new Date(drawingData.submission_date) : null,
    approval_date: drawingData.approval_date ? new Date(drawingData.approval_date) : null,
    file_url: drawingData.file_url || null,
    remarks: drawingData.remarks || null,
  };
  const [inserted] = await db('project_drawings').insert(payload).returning('*');
  return inserted;
}

async function updateDrawing(projectId, drawingId, drawingData) {
  const payload = {};
  ['drawing_type', 'level_name', 'submission_status', 'file_url', 'remarks'].forEach(k => {
    if (drawingData[k] !== undefined) payload[k] = drawingData[k];
  });
  if (drawingData.submission_date !== undefined) payload.submission_date = drawingData.submission_date ? new Date(drawingData.submission_date) : null;
  if (drawingData.approval_date !== undefined) payload.approval_date = drawingData.approval_date ? new Date(drawingData.approval_date) : null;

  const [updated] = await db('project_drawings').where({ id: drawingId, project_id: projectId }).update(payload).returning('*');
  return updated;
}

async function deleteDrawing(projectId, drawingId) {
  return db('project_drawings').where({ id: drawingId, project_id: projectId }).del();
}

async function getSupervisors(projectId) {
  return db('project_supervisors').where({ project_id: projectId });
}

async function addSupervisor(projectId, supervisorData) {
  const payload = {
    project_id: projectId,
    user_id: supervisorData.user_id || null,
    supervisor_name: supervisorData.supervisor_name || 'Supervisor',
    assigned_role: supervisorData.assigned_role || 'site_supervisor',
    contact_phone: supervisorData.contact_phone || null,
  };
  const [inserted] = await db('project_supervisors').insert(payload).returning('*');
  return inserted;
}

async function removeSupervisor(projectId, supervisorId) {
  return db('project_supervisors').where({ id: supervisorId, project_id: projectId }).del();
}

async function getCommercials(projectId) {
  return db('project_commercials').where({ project_id: projectId }).first();
}

async function upsertCommercials(projectId, data) {
  const payload = {
    project_id: projectId,
    claimed_slabs_text: data.claimed_slabs_text || null,
    payment_cert_slabs_text: data.payment_cert_slabs_text || null,
    pending_cert_slabs_text: data.pending_cert_slabs_text || null,
    claimed_amount: data.claimed_amount !== undefined ? Number(data.claimed_amount) : 0,
    certified_amount: data.certified_amount !== undefined ? Number(data.certified_amount) : 0,
    payment_received_slabs_text: data.payment_received_slabs_text || null,
    received_amount: data.received_amount !== undefined ? Number(data.received_amount) : 0,
    pdc_amount: data.pdc_amount !== undefined ? Number(data.pdc_amount) : 0,
    overdue_slabs_text: data.overdue_slabs_text || null,
    overdue_amount: data.overdue_amount !== undefined ? Number(data.overdue_amount) : 0,
    billing_status: data.billing_status || 'up_to_date',
    last_followup_date: data.last_followup_date ? new Date(data.last_followup_date) : null,
    remarks: data.remarks || null,
  };

  const existing = await db('project_commercials').where({ project_id: projectId }).first();
  if (existing) {
    const [updated] = await db('project_commercials').where({ id: existing.id }).update(payload).returning('*');
    return updated;
  } else {
    const [inserted] = await db('project_commercials').insert(payload).returning('*');
    return inserted;
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getStats,
  getProjectWithDetails,
  getSlabs,
  upsertSlab,
  batchUpdateSlabs,
  deleteSlab,
  getDrawings,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  getSupervisors,
  addSupervisor,
  removeSupervisor,
  getCommercials,
  upsertCommercials,
};

