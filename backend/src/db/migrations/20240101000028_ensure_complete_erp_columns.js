exports.up = async function(knex) {
  // 1. Drop check constraints on projects table
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

  // 2. Ensure all columns for projects exist
  await knex.raw(`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget" NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) DEFAULT 'AED';
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "location" VARCHAR(255);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "client_name" VARCHAR(255);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "start_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "planned_end_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "actual_end_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "completion_pct" NUMERIC(5,2) DEFAULT 0;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'medium';
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "site_id" UUID;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "client_id" UUID;
  `);

  // 3. Ensure all columns for sites exist
  await knex.raw(`
    ALTER TABLE "sites" DROP CONSTRAINT IF EXISTS "emirate_check" CASCADE;
    ALTER TABLE "sites" ALTER COLUMN "latitude" DROP NOT NULL;
    ALTER TABLE "sites" ALTER COLUMN "longitude" DROP NOT NULL;
  `);
};

exports.down = async function(knex) {
  // No-op
};
