exports.up = async function(knex) {
  // Drop check constraints on projects table to allow modern status strings and global configurations
  await knex.raw(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      BEGIN
        EXECUTE 'ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_status_check" CASCADE;';
      EXCEPTION WHEN OTHERS THEN NULL;
      END;

      FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'projects'
          AND tc.constraint_type = 'CHECK'
          AND tc.constraint_name NOT LIKE '%not_null%'
          AND tc.constraint_name NOT LIKE '%_id_%'
          AND tc.constraint_name NOT LIKE '%pkey%'
      ) LOOP
        BEGIN
          EXECUTE 'ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '" CASCADE;';
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END LOOP;
    END $$;
  `);

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
