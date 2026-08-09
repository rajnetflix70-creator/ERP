exports.up = function(knex) {
  return knex.schema.createTable('equipment_site_allocations', (table) => {
    table.increments('id').primary();
    table.uuid('equipment_item_id').notNullable().references('id').inTable('equipment_items').onDelete('CASCADE');
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    table.decimal('quantity').notNullable().defaultTo(0);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['equipment_item_id', 'site_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('equipment_site_allocations');
};
