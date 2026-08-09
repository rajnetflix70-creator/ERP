exports.up = function(knex) {
  return knex.schema.createTable('stock_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_item_id').notNullable().references('id').inTable('equipment_items');
    table.uuid('from_site_id').references('id').inTable('sites');
    table.uuid('to_site_id').references('id').inTable('sites');
    table.string('transaction_type').notNullable();
    table.decimal('quantity').notNullable();
    table.uuid('handled_by').notNullable().references('id').inTable('users');
    table.uuid('issued_to_user_id').references('id').inTable('users');
    table.text('remarks');
    table.timestamp('transaction_date').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
  }).then(() => {
    return knex.raw(`
      ALTER TABLE stock_transactions 
      ADD CONSTRAINT tx_type_check 
      CHECK (transaction_type IN ('issue', 'return', 'transfer', 'restock', 'damaged', 'lost'));
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('stock_transactions');
};
