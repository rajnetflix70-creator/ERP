exports.up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('full_name').notNullable();
    table.string('email').unique();
    table.string('mobile_number').unique().comment('E.164 format');
    table.string('password_hash');
    table.string('google_id').unique();
    table.integer('role_id').unsigned().references('id').inTable('roles');
    table.boolean('is_active').defaultTo(true);
    table.boolean('mobile_verified').defaultTo(false);
    table.boolean('email_verified').defaultTo(false);
    table.string('preferred_language', 2).defaultTo('en');
    table.text('avatar_url');
    table.timestamp('last_login_at');
    table.timestamps(true, true);
  }).then(() => {
    return knex.raw(`
      ALTER TABLE users 
      ADD CONSTRAINT email_or_mobile_check 
      CHECK (email IS NOT NULL OR mobile_number IS NOT NULL);
      
      ALTER TABLE users
      ADD CONSTRAINT lang_check
      CHECK (preferred_language IN ('en','ar','hi'));
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
