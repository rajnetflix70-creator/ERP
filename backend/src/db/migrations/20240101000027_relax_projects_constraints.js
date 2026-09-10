exports.up = async function(knex) {
  // Drop status check constraint on projects table to allow modern lifecycle statuses (planning, in_progress, on_hold, completed, etc.)
  await knex.raw(`
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
  `);
};

exports.down = async function(knex) {
  // No-op
};
