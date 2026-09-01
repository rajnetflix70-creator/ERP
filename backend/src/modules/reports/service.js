const db = require('../../db');

async function getDashboardStats() {
  // Projects
  const totalProjects = await db('projects').count('id as cnt').first();
  const activeProjects = await db('projects').where('status', 'in_progress').count('id as cnt').first();
  
  // Workforce
  const totalEmployees = await db('users').where('is_active', true).count('id as cnt').first();
  const todayAttendance = await db('attendance_records')
    .where('attendance_date', db.raw('CURRENT_DATE'))
    .where('status', 'Present')
    .count('id as cnt').first();

  // Materials
  const totalMaterialValueResult = await db('materials').sum('standard_rate as val').first();
  const lowStockAlerts = await db('site_material_stock').whereRaw('balance_qty < 10').count('id as cnt').first();

  // Financials (Billing)
  const totalBilled = await db('invoices').sum('total_amount as val').first();
  const totalPaid = await db('payments_received').sum('amount_received as val').first();

  // Chart data: Monthly Billing
  const monthlyBilling = await db('invoices')
    .select(db.raw("to_char(invoice_date, 'Mon-YYYY') as month"))
    .sum('total_amount as amount')
    .groupByRaw("to_char(invoice_date, 'Mon-YYYY')")
    .orderByRaw("max(invoice_date) asc")
    .limit(6);

  // Chart data: Project Progress
  const projectProgress = await db('projects')
    .select('project_name as name', 'completion_pct as progress')
    .where('status', 'in_progress');

  return {
    kpis: {
      totalProjects: totalProjects?.cnt || 0,
      activeProjects: activeProjects?.cnt || 0,
      totalEmployees: totalEmployees?.cnt || 0,
      todayAttendance: todayAttendance?.cnt || 0,
      lowStockAlerts: lowStockAlerts?.cnt || 0,
      totalBilled: totalBilled?.val || 0,
      totalPaid: totalPaid?.val || 0,
    },
    charts: {
      monthlyBilling,
      projectProgress
    }
  };
}

module.exports = {
  getDashboardStats
};
