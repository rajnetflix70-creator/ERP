exports.up = async function(knex) {
  // Drop check constraint on status column to allow modern ERP status values
  await knex.raw('ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_status_check" CASCADE;');

  // Ensure budget, client_name, location columns or other common fields are nullable / safe
  const hasCol = async (tbl, col) => knex.schema.hasColumn(tbl, col);
  
  if (!(await hasCol('projects', 'budget'))) {
    await knex.schema.table('projects', (t) => {
      t.decimal('budget', 15, 2).nullable().defaultTo(0);
    });
  }
  if (!(await hasCol('projects', 'currency'))) {
    await knex.schema.table('projects', (t) => {
      t.string('currency', 10).nullable().defaultTo('AED');
    });
  }
  if (!(await hasCol('projects', 'location'))) {
    await knex.schema.table('projects', (t) => {
      t.string('location', 255).nullable();
    });
  }
};

exports.down = async function(knex) {
  // No-op
};
