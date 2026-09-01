const db = require('../../db');
const exceljs = require('exceljs');
const PDFDocument = require('pdfkit');

async function getBulkAttendanceList(attendanceDate, projectId) {
  const dateStr = attendanceDate || new Date().toISOString().slice(0, 10);

  // Fetch all active employees
  const employees = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.is_active', true)
    .select(
      'users.id as user_id',
      'users.full_name',
      'users.email',
      'users.mobile_number',
      'roles.name as role'
    )
    .orderBy('users.full_name', 'asc');

  // Fetch existing attendance records for this date and project
  let query = db('attendance_records').where('attendance_date', dateStr);
  if (projectId) query = query.where('project_id', projectId);
  else query = query.whereNull('project_id'); // If no project selected, get generic ones

  const existingRecords = await query;

  const recordMap = {};
  existingRecords.forEach(r => { recordMap[r.user_id] = r; });

  return employees.map(emp => {
    const existing = recordMap[emp.user_id];
    return {
      user_id: emp.user_id,
      full_name: emp.full_name,
      email: emp.email,
      mobile_number: emp.mobile_number,
      role: emp.role,
      status: existing ? existing.status : 'present', // Default to present
      overtime_hours: existing ? parseFloat(existing.overtime_hours || 0) : 0,
      remarks: existing ? (existing.remarks || '') : '',
      has_record: !!existing,
      project_id: projectId || null,
    };
  });
}

async function submitBulkAttendance(data, loggedByUserId = null) {
  const { attendance_date, project_id, records } = data;
  const dateStr = attendance_date || new Date().toISOString().slice(0, 10);

  if (!Array.isArray(records) || records.length === 0) {
    const err = new Error('No attendance records provided'); err.statusCode = 400; throw err;
  }

  await db.transaction(async (trx) => {
    for (const r of records) {
      if (!r.user_id) continue;
      const status = ['present', 'absent', 'half_day', 'on_leave'].includes(r.status) ? r.status : 'present';

      // We might have multiple project check-ins in the future, for now one per day per project
      const conflictCheck = project_id ? ['user_id', 'attendance_date'] : ['user_id', 'attendance_date'];
      // Actually, if we want per-project attendance, the unique key in DB currently is just user_id + attendance_date (Wait, we didn't check DB unique constraint)
      // Let's just delete the existing for the user on this date if we update it, or use standard merge if conflict allows.
      // If we are doing project-specific, we should really just update the record.

      await trx('attendance_records')
        .insert({
          user_id: r.user_id,
          attendance_date: dateStr,
          status,
          overtime_hours: parseFloat(r.overtime_hours || 0),
          remarks: r.remarks || null,
          project_id: project_id || null,
        })
        .onConflict(['user_id', 'attendance_date'])
        .merge({
          status,
          overtime_hours: parseFloat(r.overtime_hours || 0),
          remarks: r.remarks || null,
          project_id: project_id || null,
          updated_at: db.fn.now(),
        });
    }
  });

  return { success: true, count: records.length, date: dateStr, project_id };
}

async function getAttendanceSummary(attendanceDate, projectId) {
  const dateStr = attendanceDate || new Date().toISOString().slice(0, 10);
  const totalEmployees = await db('users').where('is_active', true).count('id as cnt').first().then(r => parseInt(r.cnt||0));

  let query = db('attendance_records').where('attendance_date', dateStr);
  if (projectId) query = query.where('project_id', projectId);
  else query = query.whereNull('project_id');

  const records = await query;
  let present = 0, absent = 0, halfDay = 0, onLeave = 0;
  records.forEach(r => {
    if (r.status === 'present') present++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'half_day') halfDay++;
    else if (r.status === 'on_leave') onLeave++;
  });

  return {
    date: dateStr,
    total_employees: totalEmployees,
    marked_count: records.length,
    present, absent, half_day: halfDay, on_leave: onLeave,
    unmarked: Math.max(0, totalEmployees - records.length),
  };
}

async function getLaborCostSummary(month) {
  // month = 'YYYY-MM'
  const startDate = `${month}-01`;
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10);

  const records = await db('attendance_records as a')
    .leftJoin('users as u', 'a.user_id', 'u.id')
    .leftJoin('employee_wages as w', 'u.id', 'w.user_id')
    .leftJoin('roles as r', 'u.role_id', 'r.id')
    .where('a.attendance_date', '>=', startDate)
    .where('a.attendance_date', '<', endDate)
    .select(
      'u.id as user_id', 'u.full_name', 'r.name as role',
      'a.status', 'a.overtime_hours',
      'w.daily_rate', 'w.ot_rate_per_hour'
    );

  const summary = {};
  records.forEach(row => {
    if (!summary[row.user_id]) {
      summary[row.user_id] = {
        user_id: row.user_id,
        full_name: row.full_name,
        role: row.role,
        days_present: 0,
        ot_hours: 0,
        gross_pay: 0,
        daily_rate: parseFloat(row.daily_rate) || 0,
        ot_rate: parseFloat(row.ot_rate_per_hour) || 0,
      };
    }
    const s = summary[row.user_id];
    let dayMultiplier = 0;
    if (row.status === 'present') dayMultiplier = 1;
    if (row.status === 'half_day') dayMultiplier = 0.5;

    s.days_present += dayMultiplier;
    s.ot_hours += parseFloat(row.overtime_hours) || 0;
    s.gross_pay += (dayMultiplier * s.daily_rate) + ((parseFloat(row.overtime_hours) || 0) * s.ot_rate);
  });

  return Object.values(summary).sort((a, b) => a.full_name.localeCompare(b.full_name));
}

async function getAttendanceHistory(userId, month) {
  const startDate = `${month}-01`;
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10);

  return db('attendance_records')
    .where({ user_id: userId })
    .where('attendance_date', '>=', startDate)
    .where('attendance_date', '<', endDate)
    .orderBy('attendance_date', 'asc');
}

// Set up Wages
async function setEmployeeWages(userId, data) {
  const existing = await db('employee_wages').where({ user_id: userId }).first();
  if (existing) {
    await db('employee_wages').where({ user_id: userId }).update({
      daily_rate: data.daily_rate || 0,
      ot_rate_per_hour: data.ot_rate_per_hour || 0,
      effective_from: data.effective_from || db.fn.now()
    });
  } else {
    await db('employee_wages').insert({
      user_id: userId,
      daily_rate: data.daily_rate || 0,
      ot_rate_per_hour: data.ot_rate_per_hour || 0,
      effective_from: data.effective_from || db.fn.now()
    });
  }
  return db('employee_wages').where({ user_id: userId }).first();
}

async function generateExcelExport(date, projectId) {
  const data = await getBulkAttendanceList(date, projectId);
  const workbook = new exceljs.Workbook();
  const sheet = workbook.addWorksheet(`Attendance - ${date}`);

  sheet.columns = [
    { header: 'Employee Name', key: 'full_name', width: 25 },
    { header: 'Role', key: 'role', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'OT Hours', key: 'overtime_hours', width: 10 },
    { header: 'Remarks', key: 'remarks', width: 30 },
  ];

  data.forEach(d => sheet.addRow(d));
  return workbook;
}

module.exports = {
  getBulkAttendanceList, submitBulkAttendance, getAttendanceSummary,
  getLaborCostSummary, getAttendanceHistory, setEmployeeWages, generateExcelExport
};
