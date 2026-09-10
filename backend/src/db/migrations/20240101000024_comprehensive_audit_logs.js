exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('audit_logs');
  if (!hasTable) {
    await knex.schema.createTable('audit_logs', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('user_name', 150).nullable();
      table.string('user_role', 50).nullable();
      table.string('module', 50).notNullable().index();
      table.string('action', 100).notNullable().index();
      table.string('entity_type', 50).nullable();
      table.string('entity_id', 100).nullable();
      table.string('entity_number', 100).nullable();
      table.text('details').nullable();
      table.string('ip_address', 50).nullable();
      table.string('status', 20).defaultTo('SUCCESS');
      table.timestamp('created_at').defaultTo(knex.fn.now()).index();
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
