exports.up = async function(knex) {
  // Clients
  await knex.schema.createTable('clients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 200).notNullable();
    table.string('contact_person', 100).nullable();
    table.string('mobile', 50).nullable();
    table.string('email', 100).nullable();
    table.text('address').nullable();
    table.string('trn_number', 50).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Alter projects to add client_id
  await knex.schema.alterTable('projects', (table) => {
    table.uuid('client_id').nullable().references('id').inTable('clients').onDelete('SET NULL');
  });

  // Bill of Quantities (BOQ)
  await knex.schema.createTable('bill_of_quantities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('item_code', 50).notNullable();
    table.text('description').notNullable();
    table.string('unit', 20).notNullable();
    table.decimal('agreed_rate', 12, 2).notNullable();
    table.decimal('planned_qty', 10, 2).notNullable();
    table.timestamps(true, true);
  });

  // Invoices
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('invoice_number', 50).unique().notNullable();
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.date('invoice_date').notNullable();
    table.date('period_from').nullable();
    table.date('period_to').nullable();
    table.decimal('subtotal', 14, 2).defaultTo(0);
    table.decimal('vat_amount', 14, 2).defaultTo(0);
    table.decimal('total_amount', 14, 2).defaultTo(0);
    table.string('status', 20).defaultTo('draft'); // draft, submitted, approved, paid
    table.timestamps(true, true);
  });

  // Invoice Line Items
  await knex.schema.createTable('invoice_line_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    table.uuid('boq_item_id').nullable().references('id').inTable('bill_of_quantities').onDelete('SET NULL');
    table.text('description').notNullable();
    table.decimal('qty', 10, 2).notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('vat_rate', 5, 2).defaultTo(5.00); // 5% UAE standard
    table.decimal('amount', 14, 2).notNullable();
  });

  // Payments Received
  await knex.schema.createTable('payments_received', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    table.decimal('amount_received', 14, 2).notNullable();
    table.date('payment_date').notNullable();
    table.string('payment_mode', 50).nullable();
    table.string('reference_no', 100).nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('payments_received');
  await knex.schema.dropTableIfExists('invoice_line_items');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('bill_of_quantities');
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('client_id');
  });
  await knex.schema.dropTableIfExists('clients');
};
