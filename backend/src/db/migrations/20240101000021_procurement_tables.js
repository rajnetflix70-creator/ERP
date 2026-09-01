exports.up = async function(knex) {
  // Purchase Requests
  await knex.schema.createTable('purchase_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('pr_number', 50).unique().notNullable();
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.uuid('requested_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('status', 20).defaultTo('pending'); // pending, approved, po_raised, rejected
    table.string('priority', 20).defaultTo('medium');
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.date('date_needed').notNullable();
    table.text('remarks').nullable();
    table.timestamps(true, true);
  });

  // PR Line Items
  await knex.schema.createTable('pr_line_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('pr_id').notNullable().references('id').inTable('purchase_requests').onDelete('CASCADE');
    table.uuid('material_id').notNullable().references('id').inTable('materials').onDelete('CASCADE');
    table.decimal('qty_required', 10, 2).notNullable();
  });

  // Purchase Orders
  await knex.schema.createTable('purchase_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('po_number', 50).unique().notNullable();
    table.uuid('vendor_id').notNullable().references('id').inTable('vendors').onDelete('CASCADE');
    table.uuid('pr_id').nullable().references('id').inTable('purchase_requests').onDelete('SET NULL');
    table.uuid('raised_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('status', 20).defaultTo('draft'); // draft, submitted, approved, issued, delivered, closed, cancelled
    table.date('po_date').notNullable();
    table.decimal('total_amount', 12, 2).defaultTo(0);
    table.uuid('delivery_site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // PO Line Items
  await knex.schema.createTable('po_line_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('po_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
    table.uuid('material_id').notNullable().references('id').inTable('materials').onDelete('CASCADE');
    table.decimal('qty_ordered', 10, 2).notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total', 12, 2).notNullable();
  });

  // Goods Receipt Notes (GRN)
  await knex.schema.createTable('grn_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('po_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
    table.uuid('po_line_item_id').notNullable().references('id').inTable('po_line_items').onDelete('CASCADE');
    table.uuid('received_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('received_date').notNullable();
    table.decimal('qty_received', 10, 2).notNullable();
    table.text('remarks').nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('grn_records');
  await knex.schema.dropTableIfExists('po_line_items');
  await knex.schema.dropTableIfExists('purchase_orders');
  await knex.schema.dropTableIfExists('pr_line_items');
  await knex.schema.dropTableIfExists('purchase_requests');
};
