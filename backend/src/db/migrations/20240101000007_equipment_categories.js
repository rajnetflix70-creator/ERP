exports.up = async function(knex) {
  await knex.schema.createTable('equipment_categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.timestamps(true, true);
  });

  await knex('equipment_categories').insert([
    { name: 'Heavy Machinery' },
    { name: 'Hand Tools' },
    { name: 'Safety Gear' },
    { name: 'Consumables' },
    { name: 'Electrical Equipment' },
    { name: 'Vehicles' }
  ]);
};

exports.down = function(knex) {
  return knex.schema.dropTable('equipment_categories');
};
