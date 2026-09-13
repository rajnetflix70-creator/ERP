exports.up = async function(knex) {
  await knex.raw(`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "engineer" VARCHAR(255);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "lead_engineer" VARCHAR(255);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "manager" VARCHAR(255);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget" NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) DEFAULT 'AED';
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "location" VARCHAR(255) DEFAULT 'Dubai';
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "start_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "planned_end_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "actual_end_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "completion_pct" NUMERIC(5,2) DEFAULT 0;
  `);

  await knex.raw(`
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "engineer" VARCHAR(255);
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "manager" VARCHAR(255);
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "location" VARCHAR(255) DEFAULT 'Dubai';
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "budget" NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) DEFAULT 'AED';
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "start_date" DATE;
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "expected_completion" DATE;
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "planned_end_date" DATE;
    ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "completion_pct" NUMERIC(5,2) DEFAULT 0;
  `);
};

exports.down = async function(knex) {};
