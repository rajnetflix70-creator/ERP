exports.up = function(knex) {
  return knex.schema
    .createTable('store_categories', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('short_name').notNullable();
      table.enum('status', ['Active', 'Inactive']).defaultTo('Active');
      table.timestamps(true, true);
    })
    .createTable('store_brands', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('short_name').notNullable();
      table.enum('status', ['Active', 'Inactive']).defaultTo('Active');
      table.timestamps(true, true);
    })
    .createTable('store_materials', table => {
      table.increments('id').primary();
      table.integer('category_id').references('id').inTable('store_categories').onDelete('SET NULL');
      table.integer('brand_id').references('id').inTable('store_brands').onDelete('SET NULL');
      table.string('name').notNullable();
      table.decimal('quantity', 14, 2).defaultTo(0);
      table.string('unit').defaultTo('pcs');
      table.decimal('min_quantity', 14, 2).defaultTo(0);
      table.boolean('allow_exceed_qty').defaultTo(true);
      table.enum('status', ['Active', 'Inactive']).defaultTo('Active');
      table.timestamps(true, true);
    })
    .createTable('store_purchase_orders', table => {
      table.increments('id').primary();
      table.string('po_number').notNullable().unique();
      table.string('supplier_name').notNullable();
      table.date('po_date').notNullable();
      table.string('mtc_file_url');
      table.enum('status', ['Pending', 'Completed', 'Cancelled']).defaultTo('Pending');
      table.timestamps(true, true);
    })
    .createTable('store_po_items', table => {
      table.increments('id').primary();
      table.integer('po_id').unsigned().references('id').inTable('store_purchase_orders').onDelete('CASCADE');
      table.integer('material_id').references('id').inTable('store_materials').onDelete('CASCADE');
      table.decimal('quantity', 14, 2).notNullable();
      table.timestamps(true, true);
    })
    .createTable('store_purchase_returns', table => {
      table.increments('id').primary();
      table.integer('project_id').nullable();
      table.string('return_number').notNullable();
      table.date('return_date').notNullable();
      table.string('reason');
      table.enum('status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
      table.timestamps(true, true);
    })
    .createTable('store_return_items', table => {
      table.increments('id').primary();
      table.integer('return_id').unsigned().references('id').inTable('store_purchase_returns').onDelete('CASCADE');
      table.integer('material_id').references('id').inTable('store_materials').onDelete('CASCADE');
      table.decimal('quantity', 14, 2).notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('store_return_items')
    .dropTableIfExists('store_purchase_returns')
    .dropTableIfExists('store_po_items')
    .dropTableIfExists('store_purchase_orders')
    .dropTableIfExists('store_materials')
    .dropTableIfExists('store_brands')
    .dropTableIfExists('store_categories');
};
