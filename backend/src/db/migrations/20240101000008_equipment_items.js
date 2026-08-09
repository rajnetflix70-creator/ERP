exports.up = function(knex) {
  return knex.schema.createTable('equipment_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('asset_code').unique();
    table.integer('category_id').unsigned().references('id').inTable('equipment_categories');
    table.string('item_type').notNullable();
    table.string('unit').notNullable();
    table.decimal('reorder_level').defaultTo(0);
    table.decimal('total_quantity').notNullable().defaultTo(0);
    table.text('notes');
    table.timestamps(true, true);
  }).then(() => {
    return knex.raw(`
      ALTER TABLE equipment_items 
      ADD CONSTRAINT item_type_check 
      CHECK (item_type IN ('asset', 'consumable'));
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('equipment_items');
};
