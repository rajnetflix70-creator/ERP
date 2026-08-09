exports.up = function(knex) {
  return knex.schema.alterTable('attendance_records', (table) => {
    table.uuid('site_id').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('attendance_records', (table) => {
    table.uuid('site_id').notNullable().alter();
  });
};
