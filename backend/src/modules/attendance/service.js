const db = require('../../db');

async function getBulkAttendanceList(attendanceDate) {
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

  // Fetch existing attendance records for this date
  const existingRecords = await db('attendance_records')
    .where('attendance_date', dateStr);

  const recordMap = {};
  existingRecords.forEach(r => {
    recordMap[r.user_id] = r;
  });

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
    };
  });
}

async function submitBulkAttendance(data, loggedByUserId = null) {
  const { attendance_date, records } = data;
  const dateStr = attendance_date || new Date().toISOString().slice(0, 10);

  if (!Array.isArray(records) || records.length === 0) {
    const err = new Error('No attendance records provided');
    err.statusCode = 400;
    throw err;
  }

  await db.transaction(async (trx) => {
    for (const r of records) {
      if (!r.user_id) continue;
      const status = ['present', 'absent', 'half_day', 'on_leave'].includes(r.status) ? r.status : 'present';

      await trx('attendance_records')
        .insert({
          user_id: r.user_id,
          attendance_date: dateStr,
          status,
          overtime_hours: parseFloat(r.overtime_hours || 0),
          remarks: r.remarks || null,
        })
        .onConflict(['user_id', 'attendance_date'])
        .merge({
          status,
          overtime_hours: parseFloat(r.overtime_hours || 0),
          remarks: r.remarks || null,
          updated_at: db.fn.now(),
        });
    }
  });

  return { success: true, count: records.length, date: dateStr };
}

async function getAttendanceSummary(attendanceDate) {
  const dateStr = attendanceDate || new Date().toISOString().slice(0, 10);

  const activeEmployees = await db('users').where('is_active', true).count('id as cnt').first();
  const totalEmployees = parseInt(activeEmployees.cnt || 0);

  const records = await db('attendance_records').where('attendance_date', dateStr);

  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let onLeave = 0;

  records.forEach(r => {
    if (r.status === 'present') present++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'half_day') halfDay++;
    else if (r.status === 'on_leave') onLeave++;
  });

  const markedCount = records.length;
  const unmarked = Math.max(0, totalEmployees - markedCount);

  return {
    date: dateStr,
    total_employees: totalEmployees,
    marked_count: markedCount,
    present,
    absent,
    half_day: halfDay,
    on_leave: onLeave,
    unmarked,
  };
}

module.exports = {
  getBulkAttendanceList,
  submitBulkAttendance,
  getAttendanceSummary,
};
