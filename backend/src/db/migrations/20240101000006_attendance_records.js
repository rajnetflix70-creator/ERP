exports.up = function(knex) {
  return knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    table.date('attendance_date').notNullable();
    table.timestamp('check_in_at');
    table.decimal('check_in_lat', 10, 8);
    table.decimal('check_in_lng', 11, 8);
    table.text('check_in_photo_url');
    table.timestamp('check_out_at');
    table.decimal('check_out_lat', 10, 8);
    table.decimal('check_out_lng', 11, 8);
    table.text('check_out_photo_url');
    table.string('status').defaultTo('present');
    table.decimal('overtime_hours', 5, 2).defaultTo(0);
    table.text('remarks');
    table.timestamps(true, true);
    table.unique(['user_id', 'attendance_date']);
  }).then(() => {
    return knex.raw(`
      ALTER TABLE attendance_records 
      ADD CONSTRAINT status_check 
      CHECK (status IN ('present', 'absent', 'half_day', 'on_leave'));
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance_records');
};
