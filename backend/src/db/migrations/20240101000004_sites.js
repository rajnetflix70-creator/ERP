exports.up = function(knex) {
  return knex.schema.createTable('sites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('code').notNullable().unique();
    table.string('emirate').notNullable();
    table.text('address');
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.integer('geofence_radius_meters').notNullable().defaultTo(300);
    table.uuid('supervisor_id').references('id').inTable('users');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  }).then(() => {
    return knex.raw(`
      ALTER TABLE sites 
      ADD CONSTRAINT emirate_check 
      CHECK (emirate IN ('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'));
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sites');
};
