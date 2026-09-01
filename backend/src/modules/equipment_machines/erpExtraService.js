const db = require('../../db');

// --- MOVEMENTS ---
async function listMovements(filters = {}) {
  let q = db('equipment_movements as m')
    .leftJoin('equipment_machines as eq', 'm.machine_id', 'eq.id')
    .select('m.*', 'eq.machine_no', 'eq.machine_type', 'eq.brand');
  if (filters.status) q = q.where('m.status', filters.status);
  return q.orderBy('m.created_at', 'desc');
}

async function createMovement(data) {
  const [mov] = await db('equipment_movements').insert(data).returning('*');
  // Record activity log
  await db('activity_logs').insert({
    machine_id: data.machine_id,
    activity: `Transfer requested: ${data.from_location_name || 'Store'} → ${data.to_location_name || 'Site'}`,
    site_name: data.to_location_name,
    details: data.transfer_reason
  });
  return mov;
}

async function updateMovementStatus(id, status, receivingPerson = null) {
  const updateData = { status, updated_at: db.fn.now() };
  if (receivingPerson) updateData.receiving_person = receivingPerson;
  
  const [mov] = await db('equipment_movements').where({ id }).update(updateData).returning('*');
  
  // If completed, update machine location
  if (status === 'Completed' || status === 'Received') {
    await db('equipment_machines')
      .where({ id: mov.machine_id })
      .update({
        current_location_name: mov.to_location_name,
        status: mov.to_location_name && mov.to_location_name.includes('STORE') ? 'available' : 'deployed'
      });
  }
  return mov;
}

// --- MAINTENANCE ---
async function listMaintenance(filters = {}) {
  let q = db('maintenance_records as r')
    .leftJoin('equipment_machines as eq', 'r.machine_id', 'eq.id')
    .leftJoin('vendors as v', 'r.vendor_id', 'v.id')
    .select('r.*', 'eq.machine_no', 'eq.machine_type', 'v.vendor_name');
  if (filters.maintenance_type) q = q.where('r.maintenance_type', filters.maintenance_type);
  if (filters.status) q = q.where('r.status', filters.status);
  return q.orderBy('r.service_date', 'desc');
}

async function createMaintenance(data) {
  const totalCost = (parseFloat(data.labor_cost) || 0) + (parseFloat(data.parts_cost) || 0);
  const insertData = { ...data, total_cost: totalCost };
  const [rec] = await db('maintenance_records').insert(insertData).returning('*');
  
  // Update last maintenance date on machine
  await db('equipment_machines')
    .where({ id: data.machine_id })
    .update({
      last_maintenance_date: data.service_date,
      next_maintenance_date: data.next_service_date || null
    });

  // Record activity log
  await db('activity_logs').insert({
    machine_id: data.machine_id,
    activity: `Maintenance logged (${data.maintenance_type}): ${data.work_performed || 'Serviced'}`,
    details: `Total cost: AED ${totalCost}`
  });

  return rec;
}

// --- BREAKDOWNS ---
async function listBreakdowns(filters = {}) {
  let q = db('breakdown_records as b')
    .leftJoin('equipment_machines as eq', 'b.machine_id', 'eq.id')
    .select('b.*', 'eq.machine_no', 'eq.machine_type', 'eq.brand');
  if (filters.status) q = q.where('b.status', filters.status);
  if (filters.priority) q = q.where('b.priority', filters.priority);
  return q.orderBy('b.breakdown_date', 'desc');
}

async function createBreakdown(data) {
  const [b] = await db('breakdown_records').insert(data).returning('*');
  // Mark machine status as maintenance/breakdown
  await db('equipment_machines')
    .where({ id: data.machine_id })
    .update({ status: 'maintenance' });

  // Add notification
  await db('notifications').insert({
    title: `Breakdown Reported: Priority ${data.priority || 'Medium'}`,
    message: `Machine #${data.machine_id} breakdown reported. Problem: ${data.problem_description}`,
    type: 'Breakdown'
  });

  return b;
}

async function updateBreakdown(id, data) {
  const [b] = await db('breakdown_records').where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
  if (data.status === 'Resolved' || data.status === 'Closed') {
    await db('equipment_machines')
      .where({ id: b.machine_id })
      .update({ status: 'available' });
  }
  return b;
}

// --- DOCUMENTS ---
async function listDocuments(filters = {}) {
  let q = db('equipment_documents as d')
    .leftJoin('equipment_machines as eq', 'd.machine_id', 'eq.id')
    .select('d.*', 'eq.machine_no', 'eq.machine_type');
  if (filters.status) q = q.where('d.status', filters.status);
  return q.orderBy('d.expiry_date', 'asc');
}

async function createDocument(data) {
  // Check if expiring within 30 days
  const today = new Date();
  const expDate = new Date(data.expiry_date);
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  let status = 'Valid';
  if (diffDays <= 0) status = 'Expired';
  else if (diffDays <= 30) status = 'Expiring Soon';

  const [doc] = await db('equipment_documents').insert({ ...data, status }).returning('*');
  return doc;
}

// --- OPERATORS ---
async function listOperators() {
  return db('operators as op')
    .leftJoin('equipment_machines as eq', 'op.assigned_machine_id', 'eq.id')
    .select('op.*', 'eq.machine_no', 'eq.machine_type')
    .orderBy('op.name', 'asc');
}

async function createOperator(data) {
  const [op] = await db('operators').insert(data).returning('*');
  return op;
}

// --- VENDORS ---
async function listVendors() {
  return db('vendors').orderBy('vendor_name', 'asc');
}

async function createVendor(data) {
  // Strip id (null from frontend) and any undefined fields before inserting
  const { id, ...rest } = data;
  const insertData = Object.fromEntries(
    Object.entries(rest).filter(([_, v]) => v !== undefined && v !== null || typeof v === 'boolean' || typeof v === 'number')
  );
  const [v] = await db('vendors').insert(insertData).returning('*');
  return v;
}

async function updateVendor(id, data) {
  const { id: _id, ...rest } = data;
  const [v] = await db('vendors').where({ id }).update({ ...rest, updated_at: db.fn.now() }).returning('*');
  return v;
}

// --- NOTIFICATIONS ---
async function listNotifications() {
  return db('notifications').orderBy('created_at', 'desc').limit(20);
}

async function markNotificationRead(id) {
  return db('notifications').where({ id }).update({ is_read: true });
}

// --- REPORTS ---
async function getReportsData() {
  const equipmentStats = await db('equipment_machines').where('is_active', true).select('status').count('* as cnt').groupBy('status');
  const siteCounts = await db('equipment_machines').where('is_active', true).select('current_location_name').count('* as cnt').groupBy('current_location_name');
  const maintenanceCost = await db('maintenance_records').sum('total_cost as total_cost').first();
  const expiringDocs = await db('equipment_documents').whereIn('status', ['Expiring Soon', 'Expired']);

  return {
    equipment_stats: equipmentStats,
    site_counts: siteCounts.slice(0, 10),
    total_maintenance_cost: maintenanceCost ? maintenanceCost.total_cost : 0,
    expiring_docs_count: expiringDocs.length,
    expiring_docs: expiringDocs
  };
}

module.exports = {
  listMovements, createMovement, updateMovementStatus,
  listMaintenance, createMaintenance,
  listBreakdowns, createBreakdown, updateBreakdown,
  listDocuments, createDocument,
  listOperators, createOperator,
  listVendors, createVendor, updateVendor,
  listNotifications, markNotificationRead,
  getReportsData
};
