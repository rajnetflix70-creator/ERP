exports.up = function(knex) {
  return knex.schema.createTable('otp_codes', (table) => {
    table.increments('id').primary();
    table.string('mobile_number').notNullable();
    table.string('code_hash').notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.integer('attempt_count').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('otp_codes');
};
