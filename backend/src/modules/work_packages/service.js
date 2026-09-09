const db = require('../../db');

async function listWorkPackages(filters = {}) {
  let q = db('work_packages as wp')
    .leftJoin('projects as p', 'wp.project_id', 'p.id')
    .leftJoin('sites as s', 'wp.site_id', 's.id')
    .leftJoin('users as u', 'wp.assigned_to', 'u.id')
    .select(
      'wp.*',
      'p.project_name', 'p.ak_job_no', 'p.folder_no',
      's.name as site_name',
      'u.full_name as assigned_to_name'
    )
    .orderBy('wp.created_at', 'desc');

  if (filters.project_id) q = q.where('wp.project_id', filters.project_id);
  if (filters.status)     q = q.where('wp.status', filters.status);
  if (filters.priority)   q = q.where('wp.priority', filters.priority);
  if (filters.assigned_to) q = q.where('wp.assigned_to', filters.assigned_to);
  if (filters.search) {
    const s = `%${filters.search}%`;
    q = q.where(function() {
      this.whereILike('wp.title', s)
        .orWhereILike('p.project_name', s)
        .orWhereILike('p.ak_job_no', s);
    });
  }
  return q;
}

async function getWorkPackage(id) {
  const wp = await db('work_packages as wp')
    .leftJoin('projects as p', 'wp.project_id', 'p.id')
    .leftJoin('sites as s', 'wp.site_id', 's.id')
    .leftJoin('users as u', 'wp.assigned_to', 'u.id')
    .where('wp.id', id)
    .select(
      'wp.*',
      'p.project_name', 'p.ak_job_no',
      's.name as site_name',
      'u.full_name as assigned_to_name'
    )
    .first();

  if (!wp) { const e = new Error('Work package not found'); e.statusCode = 404; throw e; }
  return wp;
}

async function createWorkPackage(data, userId) {
  const insert = {
    project_id: data.project_id,
    site_id: data.site_id || null,
    title: data.title,
    description: data.description || null,
    status: data.status || 'not_started',
    priority: data.priority || 'medium',
    assigned_to: data.assigned_to || null,
    planned_start: data.planned_start || null,
    planned_end: data.planned_end || null,
    completion_pct: data.completion_pct || 0,
    blocked_reason: data.blocked_reason || null,
  };
  const [wp] = await db('work_packages').insert(insert).returning('*');
  return wp;
}

async function updateWorkPackage(id, data) {
  const existing = await db('work_packages').where({ id }).first();
  if (!existing) { const e = new Error('Work package not found'); e.statusCode = 404; throw e; }

  const update = {};
  const allowed = ['project_id','site_id','title','description','status','priority','assigned_to','planned_start','planned_end','actual_start','actual_end','completion_pct','blocked_reason'];
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k] || null; });

  // Auto-set actual_start when moving to in_progress
  if (data.status === 'in_progress' && !existing.actual_start && !data.actual_start) {
    update.actual_start = new Date();
  }
  // Auto-set actual_end when completing
  if (data.status === 'completed') {
    update.completion_pct = 100;
    if (!existing.actual_end && !data.actual_end) update.actual_end = new Date();
  }
  // Auto-update project completion_pct
  if (data.completion_pct !== undefined || data.status === 'completed') {
    setImmediate(() => recalcProjectCompletion(existing.project_id));
  }

  const [wp] = await db('work_packages').where({ id }).update(update).returning('*');
  return wp;
}

async function deleteWorkPackage(id) {
  const deleted = await db('work_packages').where({ id }).del();
  if (!deleted) { const e = new Error('Work package not found'); e.statusCode = 404; throw e; }
  return { id };
}

async function logProgress(workPackageId, data, userId) {
  const wp = await db('work_packages').where({ id: workPackageId }).first();
  if (!wp) { const e = new Error('Work package not found'); e.statusCode = 404; throw e; }

  const [log] = await db('daily_progress_logs').insert({
    work_package_id: workPackageId,
    project_id: wp.project_id,
    logged_by: userId,
    log_date: data.log_date,
    work_description: data.work_description,
    qty_completed: data.qty_completed || null,
    qty_unit: data.qty_unit || null,
    completion_pct: data.completion_pct || null,
    status_after: data.status_after || null,
    issues_encountered: data.issues_encountered || null,
  }).returning('*');

  // Update work package with latest progress
  const updates = {};
  if (data.completion_pct !== undefined) updates.completion_pct = data.completion_pct;
  if (data.status_after) updates.status = data.status_after;
  if (data.status_after === 'in_progress' && !wp.actual_start) updates.actual_start = new Date();
  if (data.status_after === 'completed') {
    updates.completion_pct = 100;
    updates.actual_end = new Date();
  }
  if (Object.keys(updates).length > 0) {
    await db('work_packages').where({ id: workPackageId }).update(updates);
    setImmediate(() => recalcProjectCompletion(wp.project_id));
  }

  return log;
}

async function getProgressLogs(workPackageId) {
  return db('daily_progress_logs as dl')
    .leftJoin('users as u', 'dl.logged_by', 'u.id')
    .where('dl.work_package_id', workPackageId)
    .select('dl.*', 'u.full_name as logged_by_name')
    .orderBy('dl.log_date', 'desc');
}

async function getKanbanBoard(projectId) {
  const where = projectId ? { 'wp.project_id': projectId } : {};
  const all = await db('work_packages as wp')
    .leftJoin('users as u', 'wp.assigned_to', 'u.id')
    .leftJoin('projects as p', 'wp.project_id', 'p.id')
    .where(where)
    .select('wp.*', 'u.full_name as assigned_to_name', 'p.project_name', 'p.ak_job_no')
    .orderBy('wp.priority', 'desc');

  const columns = {
    not_started: [],
    in_progress:  [],
    completed:    [],
    blocked:      [],
    delayed:      [],
  };
  all.forEach(wp => {
    const col = columns[wp.status] || columns.not_started;
    col.push(wp);
  });
  return columns;
}

async function recalcProjectCompletion(projectId) {
  try {
    const result = await db('work_packages')
      .where({ project_id: projectId })
      .avg('completion_pct as avg_pct')
      .first();
    const avg = parseFloat(result.avg_pct) || 0;
    await db('projects').where({ id: projectId }).update({ completion_pct: Math.round(avg * 100) / 100 });
  } catch (e) { /* ignore background recalc errors */ }
}

module.exports = { listWorkPackages, getWorkPackage, createWorkPackage, updateWorkPackage, deleteWorkPackage, logProgress, getProgressLogs, getKanbanBoard };
