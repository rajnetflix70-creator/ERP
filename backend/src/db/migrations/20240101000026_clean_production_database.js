const bcrypt = require('bcryptjs');

exports.up = async function(knex) {
  // 1. Disable foreign key constraints or truncate in reverse dependency order
  const tablesToClear = [
    'audit_logs',
    'payments_received',
    'invoice_line_items',
    'invoices',
    'bill_of_quantities',
    'clients',
    'material_consumption',
    'material_requests',
    'site_material_stock',
    'materials',
    'grn_records',
    'po_line_items',
    'purchase_orders',
    'pr_line_items',
    'purchase_requests',
    'vendors',
    'breakdown_records',
    'maintenance_records',
    'equipment_movements',
    'equipment_daily_logs',
    'equipment_machines',
    'operators',
    'equipment_site_allocations',
    'stock_transactions',
    'equipment_items',
    'equipment_categories',
    'store_transactions',
    'store_stock',
    'store_materials',
    'store_brands',
    'store_categories',
    'work_package_logs',
    'work_packages',
    'attendance_records',
    'site_assignments',
    'projects',
    'sites',
    'otp_codes'
  ];

  for (const table of tablesToClear) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      try {
        await knex.raw(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch (e) {
        try {
          await knex(table).del();
        } catch (delErr) {
          // Ignore if table not present
        }
      }
    }
  }

  // 2. Clean users table except admin
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    try {
      await knex.raw('TRUNCATE TABLE users CASCADE;');
    } catch (e) {
      await knex('users').del();
    }
  }

  // 3. Ensure system roles exist
  const hasRoles = await knex.schema.hasTable('roles');
  if (hasRoles) {
    const roles = [
      { id: 1, name: 'super_admin', description: 'Super Administrator' },
      { id: 2, name: 'company_admin', description: 'Company Administrator' },
      { id: 3, name: 'project_manager', description: 'Project Manager' },
      { id: 4, name: 'site_supervisor', description: 'Site Supervisor' },
      { id: 5, name: 'worker', description: 'Site Worker' }
    ];

    for (const r of roles) {
      await knex('roles').insert(r).onConflict('id').merge();
    }
  }

  // 4. Seed clean Super Admin & Company Admin accounts
  const hash = await bcrypt.hash('Admin@1234', 10);
  
  await knex('users').insert([
    {
      full_name: 'Super Admin',
      email: 'super_admin@sitetrack.ae',
      password_hash: hash,
      email_verified: true,
      role_id: 1,
      is_active: true
    },
    {
      full_name: 'Company Admin',
      email: 'admin@sitetrack.ae',
      password_hash: hash,
      email_verified: true,
      role_id: 2,
      is_active: true
    }
  ]);
};

exports.down = async function(knex) {
  // No-op
};
