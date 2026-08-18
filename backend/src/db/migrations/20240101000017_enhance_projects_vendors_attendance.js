exports.up = async function(knex) {
  // Add missing columns to projects table
  await knex.schema.alterTable('projects', (table) => {
    table.uuid('site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.string('client_name', 200).nullable();
    table.date('start_date').nullable();
    table.date('planned_end_date').nullable();
    table.date('actual_end_date').nullable();
    table.decimal('completion_pct', 5, 2).defaultTo(0);
    table.string('priority', 20).defaultTo('medium'); // low, medium, high, critical
  });

  // Add project_id to attendance_records for site-project context
  await knex.schema.alterTable('attendance_records', (table) => {
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
  });

  // Enhance vendors table with procurement fields
  await knex.schema.alterTable('vendors', (table) => {
    table.string('trn_number', 50).nullable();
    table.string('bank_name', 100).nullable();
    table.string('bank_account', 100).nullable();
    table.integer('credit_days').defaultTo(30);
    table.string('vendor_category', 50).defaultTo('equipment'); // equipment, material, labour, transport
    table.boolean('is_active').defaultTo(true);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('vendors', (table) => {
    table.dropColumn('trn_number');
    table.dropColumn('bank_name');
    table.dropColumn('bank_account');
    table.dropColumn('credit_days');
    table.dropColumn('vendor_category');
    table.dropColumn('is_active');
  });
  await knex.schema.alterTable('attendance_records', (table) => {
    table.dropColumn('project_id');
  });
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('site_id');
    table.dropColumn('client_name');
    table.dropColumn('start_date');
    table.dropColumn('planned_end_date');
    table.dropColumn('actual_end_date');
    table.dropColumn('completion_pct');
    table.dropColumn('priority');
  });
};
