const db = require('../../db');

/* ── Helpers ─────────────────────────────────────────────────── */
let mrSeq = null;
async function nextMrNumber() {
  const [{ cnt }] = await db('material_requests').count('id as cnt');
  const num = String(parseInt(cnt) + 1).padStart(4, '0');
  const yr  = new Date().getFullYear();
  return `MR-${yr}-${num}`;
}

async function recalcStock(material_id, project_id) {
  const stock = await db('site_material_stock').where({ material_id, project_id }).first();
  if (!stock) return;
  const issued   = await db('material_consumption').where({ material_id, project_id }).sum('qty_consumed as s').first();
  const received = parseFloat(stock.received_qty) || 0;
  const opening  = parseFloat(stock.opening_qty)  || 0;
  const returned = parseFloat(stock.returned_qty) || 0;
  const cons     = parseFloat(issued?.s)           || 0;
  await db('site_material_stock').where({ material_id, project_id }).update({
    issued_qty:  cons,
    balance_qty: opening + received - cons + returned,
  });
}

/* ── Material Master ─────────────────────────────────────────── */
async function listMaterials(filters = {}) {
  let q = db('materials').orderBy('category').orderBy('name');
  if (filters.category)  q = q.where('category', filters.category);
  if (filters.is_active !== undefined) q = q.where('is_active', filters.is_active);
  if (filters.search)    q = q.whereILike('name', `%${filters.search}%`);
  return q;
}

async function getMaterial(id) {
  const m = await db('materials').where({ id }).first();
  if (!m) { const e = new Error('Material not found'); e.statusCode = 404; throw e; }
  return m;
}

async function createMaterial(data) {
  const exists = await db('materials').whereILike('material_code', data.material_code).first();
  if (exists) { const e = new Error(`Material code "${data.material_code}" already exists`); e.statusCode = 409; throw e; }
  const [m] = await db('materials').insert(data).returning('*');
  return m;
}

async function updateMaterial(id, data) {
  const [m] = await db('materials').where({ id }).update(data).returning('*');
  if (!m) { const e = new Error('Material not found'); e.statusCode = 404; throw e; }
  return m;
}

async function deleteMaterial(id) {
  const [m] = await db('materials').where({ id }).update({ is_active: false }).returning(['id', 'name', 'is_active']);
  if (!m) { const e = new Error('Material not found'); e.statusCode = 404; throw e; }
  return m;
}

/* ── Material Requests ─────────────────────────────────────────── */
async function listRequests(filters = {}) {
  let q = db('material_requests as mr')
    .leftJoin('materials as m',  'mr.material_id',  'm.id')
    .leftJoin('projects as p',   'mr.project_id',   'p.id')
    .leftJoin('sites as s',      'mr.site_id',      's.id')
    .leftJoin('users as u1',     'mr.requested_by', 'u1.id')
    .leftJoin('users as u2',     'mr.approved_by',  'u2.id')
    .select(
      'mr.*',
      'm.name as material_name', 'm.unit_of_measure', 'm.category',
      'p.project_name', 'p.ak_job_no',
      's.name as site_name',
      'u1.full_name as requested_by_name',
      'u2.full_name as approved_by_name'
    )
    .orderBy('mr.created_at', 'desc');

  if (filters.status)     q = q.where('mr.status', filters.status);
  if (filters.project_id) q = q.where('mr.project_id', filters.project_id);
  return q;
}

async function createRequest(data, userId) {
  const mr_number = await nextMrNumber();
  const [req] = await db('material_requests').insert({
    mr_number,
    project_id:    data.project_id,
    site_id:       data.site_id || null,
    material_id:   data.material_id,
    requested_by:  userId,
    qty_requested: data.qty_requested,
    date_needed:   data.date_needed || null,
    purpose:       data.purpose || null,
    priority:      data.priority || 'normal',
    status:        'pending',
  }).returning('*');
  return req;
}

async function approveRequest(id, data, userId) {
  const req = await db('material_requests').where({ id }).first();
  if (!req) { const e = new Error('Request not found'); e.statusCode = 404; throw e; }
  if (!['pending'].includes(req.status)) {
    const e = new Error(`Cannot change status from "${req.status}"`); e.statusCode = 400; throw e;
  }
  const [updated] = await db('material_requests').where({ id }).update({
    status:         data.status,
    approved_by:    userId,
    approved_at:    new Date(),
    approval_notes: data.approval_notes || null,
  }).returning('*');
  return updated;
}

async function issueRequest(id, data, userId) {
  return db.transaction(async (trx) => {
    const req = await trx('material_requests').where({ id }).first();
    if (!req) { const e = new Error('Request not found'); e.statusCode = 404; throw e; }
    if (req.status !== 'approved') { const e = new Error('Only approved requests can be issued'); e.statusCode = 400; throw e; }

    const qty_issued = parseFloat(data.qty_issued);

    // Update request status
    const [updated] = await trx('material_requests').where({ id }).update({
      status:    'issued',
      qty_issued,
      issued_at: new Date(),
      issued_by: userId,
    }).returning('*');

    // Ensure site stock row exists
    const stockKey = { material_id: req.material_id, project_id: req.project_id };
    const existing = await trx('site_material_stock').where(stockKey).first();
    if (existing) {
      await trx('site_material_stock').where(stockKey).update({
        received_qty: db.raw('received_qty + ?', [qty_issued]),
        balance_qty:  db.raw('balance_qty + ?', [qty_issued]),
      });
    } else {
      await trx('site_material_stock').insert({
        ...stockKey,
        site_id:      req.site_id || null,
        opening_qty:  0,
        received_qty: qty_issued,
        issued_qty:   0,
        returned_qty: 0,
        balance_qty:  qty_issued,
      });
    }
    return updated;
  });
}

/* ── Consumption ─────────────────────────────────────────────── */
async function recordConsumption(data, userId) {
  const [log] = await db('material_consumption').insert({
    material_id:        data.material_id,
    project_id:         data.project_id,
    site_id:            data.site_id || null,
    work_package_id:    data.work_package_id || null,
    material_request_id: data.material_request_id || null,
    qty_consumed:       data.qty_consumed,
    consumption_date:   data.consumption_date,
    logged_by:          userId,
    notes:              data.notes || null,
  }).returning('*');

  // Recalculate stock balance
  setImmediate(() => recalcStock(data.material_id, data.project_id));
  return log;
}

async function listConsumption(filters = {}) {
  let q = db('material_consumption as mc')
    .leftJoin('materials as m',      'mc.material_id',      'm.id')
    .leftJoin('projects as p',       'mc.project_id',       'p.id')
    .leftJoin('users as u',          'mc.logged_by',        'u.id')
    .leftJoin('work_packages as wp', 'mc.work_package_id',  'wp.id')
    .select(
      'mc.*',
      'm.name as material_name', 'm.unit_of_measure',
      'p.project_name',
      'u.full_name as logged_by_name',
      'wp.title as work_package_title'
    )
    .orderBy('mc.consumption_date', 'desc');

  if (filters.project_id)  q = q.where('mc.project_id', filters.project_id);
  if (filters.material_id) q = q.where('mc.material_id', filters.material_id);
  return q;
}

/* ── Site Stock ─────────────────────────────────────────────────── */
async function getSiteStock(filters = {}) {
  let q = db('site_material_stock as ss')
    .leftJoin('materials as m',  'ss.material_id',  'm.id')
    .leftJoin('projects as p',   'ss.project_id',   'p.id')
    .leftJoin('sites as s',      'ss.site_id',      's.id')
    .select(
      'ss.*',
      'm.name as material_name', 'm.unit_of_measure', 'm.category',
      'm.reorder_level', 'm.standard_rate',
      'p.project_name', 'p.ak_job_no',
      's.name as site_name'
    )
    .orderBy('m.category').orderBy('m.name');

  if (filters.project_id) q = q.where('ss.project_id', filters.project_id);
  if (filters.site_id)    q = q.where('ss.site_id', filters.site_id);

  const rows = await q;
  // Annotate low-stock flag
  return rows.map(r => ({
    ...r,
    is_low_stock: parseFloat(r.balance_qty) <= parseFloat(r.reorder_level),
    balance_value: parseFloat(r.balance_qty) * parseFloat(r.standard_rate || 0),
  }));
}

async function getLowStockAlerts() {
  const stocks = await getSiteStock();
  return stocks.filter(s => s.is_low_stock);
}

module.exports = {
  listMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  listRequests, createRequest, approveRequest, issueRequest,
  recordConsumption, listConsumption,
  getSiteStock, getLowStockAlerts,
};
