exports.up = async function(knex) {
  // Material master catalog
  await knex.schema.createTable('materials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('material_code', 50).unique().notNullable();
    table.string('name', 200).notNullable();
    table.string('unit_of_measure', 30).notNullable(); // bags, kg, m, sqft, litre, nos, rolls
    table.string('category', 60).notNullable(); // Cement, Steel, Cables, Grouting, Chemical, Hardware, Other
    table.decimal('standard_rate', 12, 2).defaultTo(0); // cost per unit (AED)
    table.text('description').nullable();
    table.decimal('reorder_level', 10, 2).defaultTo(0); // alert when stock drops below this
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Site-wise material stock balance
  await knex.schema.createTable('site_material_stock', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('material_id').notNullable().references('id').inTable('materials').onDelete('CASCADE');
    table.uuid('site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.decimal('opening_qty', 12, 2).defaultTo(0);
    table.decimal('received_qty', 12, 2).defaultTo(0);
    table.decimal('issued_qty', 12, 2).defaultTo(0);
    table.decimal('returned_qty', 12, 2).defaultTo(0);
    table.decimal('balance_qty', 12, 2).defaultTo(0); // computed: opening + received - issued + returned
    table.timestamps(true, true);
    table.unique(['material_id', 'project_id']); // one row per material per project
  });

  // Material request workflow (site supervisor raises → admin approves → issues)
  await knex.schema.createTable('material_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('mr_number', 30).unique().notNullable(); // MR-2026-0001
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.uuid('requested_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('material_id').notNullable().references('id').inTable('materials').onDelete('CASCADE');
    table.decimal('qty_requested', 12, 2).notNullable();
    table.date('date_needed').nullable();
    table.string('purpose', 300).nullable(); // what the material is for
    table.string('priority', 20).defaultTo('normal'); // urgent, normal, low
    // Approval
    table.string('status', 30).defaultTo('pending'); // pending, approved, rejected, issued, cancelled
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at').nullable();
    table.text('approval_notes').nullable();
    // Issue tracking
    table.decimal('qty_issued', 12, 2).nullable();
    table.timestamp('issued_at').nullable();
    table.uuid('issued_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // Material consumption / usage log per task
  await knex.schema.createTable('material_consumption', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('material_id').notNullable().references('id').inTable('materials').onDelete('CASCADE');
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.uuid('work_package_id').nullable().references('id').inTable('work_packages').onDelete('SET NULL');
    table.uuid('material_request_id').nullable().references('id').inTable('material_requests').onDelete('SET NULL');
    table.decimal('qty_consumed', 12, 2).notNullable();
    table.date('consumption_date').notNullable();
    table.uuid('logged_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('notes').nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('material_consumption');
  await knex.schema.dropTableIfExists('material_requests');
  await knex.schema.dropTableIfExists('site_material_stock');
  await knex.schema.dropTableIfExists('materials');
};
