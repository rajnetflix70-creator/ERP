exports.up = function(knex) {
  return knex.schema.createTable('equipment_machines', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('machine_type', 50).notNullable() // stressing|flower|grouting|gun|stapler_gun|drill|coring|pneumatic_gun|release_barrel|cutter
      .checkIn(['stressing', 'flower', 'grouting', 'gun', 'stapler_gun', 'drill', 'coring', 'pneumatic_gun', 'release_barrel', 'cutter']);
    table.string('brand', 100).nullable();
    table.string('machine_no', 100).nullable();
    table.string('jack_no', 100).nullable();
    table.string('pump_no', 100).nullable();
    table.string('pressure_gauge_no', 100).nullable();
    table.string('motor_no', 100).nullable();
    table.uuid('current_site_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.string('current_location_name', 200).nullable(); // e.g. 'PELAGOS STORE', '309.LUXRIDGE'
    table.text('condition_remarks').nullable(); // e.g. 'Pump only, Jack in Pelagos'
    table.string('status', 30).defaultTo('available') // available|deployed|maintenance|missing
      .checkIn(['available', 'deployed', 'maintenance', 'missing']);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('equipment_machines');
};
