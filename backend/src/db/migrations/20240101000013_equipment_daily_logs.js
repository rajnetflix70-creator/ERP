exports.up = function(knex) {
  return knex.schema.createTable('equipment_daily_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').notNullable().references('id').inTable('equipment_machines').onDelete('CASCADE');
    table.date('log_date').notNullable();
    table.string('location_name', 200).notNullable(); // Site code / store name
    table.uuid('logged_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.unique(['machine_id', 'log_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('equipment_daily_logs');
};
