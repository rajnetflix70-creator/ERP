exports.up = function(knex) {
  return knex.schema.createTable('site_assignments', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    table.date('assigned_from').notNullable();
    table.date('assigned_to');
    table.timestamps(true, true);
    table.unique(['user_id', 'site_id', 'assigned_from']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('site_assignments');
};
