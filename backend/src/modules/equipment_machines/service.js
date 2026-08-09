const db = require('../../db');

async function listMachines(filters = {}) {
  let q = db('equipment_machines').where('is_active', true).orderBy('machine_no', 'asc');
  if (filters.machine_type) q = q.where('machine_type', filters.machine_type);
  if (filters.status) q = q.where('status', filters.status);
  if (filters.search) {
    q = q.where((builder) => {
      builder.whereILike('machine_no', `%${filters.search}%`)
        .orWhereILike('brand', `%${filters.search}%`)
        .orWhereILike('jack_no', `%${filters.search}%`)
        .orWhereILike('pump_no', `%${filters.search}%`)
        .orWhereILike('pressure_gauge_no', `%${filters.search}%`)
        .orWhereILike('calibration_cert_no', `%${filters.search}%`)
        .orWhereILike('current_location_name', `%${filters.search}%`);
    });
  }
  return q;
}

async function getMachine(id) {
  const m = await db('equipment_machines').where({ id, is_active: true }).first();
  if (!m) { const e = new Error('Machine not found'); e.statusCode = 404; throw e; }
  return m;
}

async function createMachine(data) {
  const [m] = await db('equipment_machines').insert(data).returning('*');
  return m;
}

async function updateMachine(id, data) {
  const [m] = await db('equipment_machines').where({ id }).update(data).returning('*');
  if (!m) { const e = new Error('Machine not found'); e.statusCode = 404; throw e; }
  return m;
}

async function deleteMachine(id) {
  const [m] = await db('equipment_machines').where({ id }).update({ is_active: false }).returning(['id', 'machine_no']);
  if (!m) { const e = new Error('Machine not found'); e.statusCode = 404; throw e; }
  return m;
}

async function getDailyGrid(startDate = '2026-02-01', endDate = '2026-02-21', type = null) {
  let machineQuery = db('equipment_machines').where('is_active', true).orderBy('machine_no', 'asc');
  if (type) machineQuery = machineQuery.where('machine_type', type);

  const machines = await machineQuery;
  const machineIds = machines.map(m => m.id);

  const logs = await db('equipment_daily_logs')
    .whereIn('machine_id', machineIds)
    .whereBetween('log_date', [startDate, endDate])
    .orderBy('log_date', 'asc');

  // Build log map: machine_id -> { log_date: location_name }
  const logMap = {};
  logs.forEach(l => {
    const dStr = new Date(l.log_date).toISOString().slice(0, 10);
    if (!logMap[l.machine_id]) logMap[l.machine_id] = {};
    logMap[l.machine_id][dStr] = l.location_name;
  });

  return machines.map(m => ({
    ...m,
    daily_locations: logMap[m.id] || {},
  }));
}

async function updateDailyLog(machine_id, log_date, location_name, userId = null) {
  await db('equipment_daily_logs')
    .insert({
      machine_id,
      log_date,
      location_name,
      logged_by: userId,
    })
    .onConflict(['machine_id', 'log_date'])
    .merge({
      location_name,
      logged_by: userId,
      updated_at: db.fn.now(),
    });

  // Also update machine's current location if log_date is today or latest
  await db('equipment_machines')
    .where({ id: machine_id })
    .update({ current_location_name: location_name, updated_at: db.fn.now() });

  return { success: true, machine_id, log_date, location_name };
}

async function getSiteFleet(filters = {}) {
  let q = db('equipment_machines').where('is_active', true).orderBy('machine_no', 'asc');
  if (filters.machine_type && filters.machine_type !== 'all') {
    q = q.where('machine_type', filters.machine_type);
  }
  if (filters.search) {
    const s = `%${filters.search}%`;
    q = q.where((builder) => {
      builder.whereILike('machine_no', s)
        .orWhereILike('brand', s)
        .orWhereILike('current_location_name', s)
        .orWhereILike('jack_no', s)
        .orWhereILike('pump_no', s);
    });
  }
  const machines = await q;

  const locationMap = {};
  machines.forEach(m => {
    const loc = m.current_location_name || 'UNASSIGNED STORE';
    if (!locationMap[loc]) {
      locationMap[loc] = {
        location_name: loc,
        is_store: loc.includes('STORE'),
        total_count: 0,
        stressing_count: 0,
        flower_count: 0,
        grouting_count: 0,
        auxiliary_count: 0,
        machines: []
      };
    }
    locationMap[loc].total_count += 1;
    if (m.machine_type === 'stressing') locationMap[loc].stressing_count += 1;
    else if (m.machine_type === 'flower') locationMap[loc].flower_count += 1;
    else if (m.machine_type === 'grouting') locationMap[loc].grouting_count += 1;
    else locationMap[loc].auxiliary_count += 1;

    locationMap[loc].machines.push(m);
  });

  return Object.values(locationMap).sort((a, b) => b.total_count - a.total_count);
}

async function getCalibrationSummary() {
  const machines = await db('equipment_machines')
    .where('is_active', true)
    .whereIn('machine_type', ['stressing', 'flower', 'grouting']);

  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;

  machines.forEach(m => {
    if (!m.calibration_expiry_date) {
      expiringSoon++;
      return;
    }
    const exp = new Date(m.calibration_expiry_date);
    if (exp < today) {
      expired++;
    } else if (exp <= thirtyDaysLater) {
      expiringSoon++;
    } else {
      valid++;
    }
  });

  return {
    total_tracked: machines.length,
    valid,
    expiring_soon: expiringSoon,
    expired,
  };
}

async function getStats() {
  const rows = await db('equipment_machines')
    .where('is_active', true)
    .select('machine_type')
    .count('id as cnt')
    .groupBy('machine_type');

  const stats = { total: 0, stressing: 0, flower: 0, grouting: 0, auxiliary: 0 };
  rows.forEach(r => {
    const c = parseInt(r.cnt);
    stats.total += c;
    if (r.machine_type === 'stressing') stats.stressing = c;
    else if (r.machine_type === 'flower') stats.flower = c;
    else if (r.machine_type === 'grouting') stats.grouting = c;
    else stats.auxiliary += c;
  });

  return stats;
}

module.exports = {
  listMachines, getMachine, createMachine, updateMachine, deleteMachine,
  getDailyGrid, updateDailyLog, getSiteFleet, getCalibrationSummary, getStats,
};
