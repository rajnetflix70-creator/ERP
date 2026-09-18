exports.up = async function(knex) {
  // 1. Ensure projects master table has all PT & Excel columns
  await knex.raw(`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "folder_no" VARCHAR(30);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "ak_job_no" VARCHAR(50);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "plot_no" VARCHAR(100);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "job_division" VARCHAR(50) DEFAULT 'pt_slab';
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tender_net_area" NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "actual_project_area" NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "slab_scope_description" TEXT;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "total_slabs_count" NUMERIC(5,1) DEFAULT 0;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "pm_lead" VARCHAR(100);
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "pm_user_id" UUID;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "engineer_user_id" UUID;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "running_count" INTEGER DEFAULT 1;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "expected_start_date" DATE;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "expected_completion_date" DATE;
  `);

  // 2. Create project_slabs table (Floor-by-Floor PT Milestones)
  const hasProjectSlabs = await knex.schema.hasTable('project_slabs');
  if (!hasProjectSlabs) {
    await knex.schema.createTable('project_slabs', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
      t.string('floor_name', 50).notNullable();
      t.integer('floor_order').notNullable().defaultTo(1);
      t.decimal('area_sqft', 10, 2).defaultTo(0);
      
      t.string('material_po_status', 50).defaultTo('pending');
      t.string('material_site_status', 50).defaultTo('pending');
      t.string('strand_cutting_status', 50).defaultTo('to_do');
      t.string('laying_status', 50).defaultTo('to_do');
      t.string('top_steel_status', 50).defaultTo('pending');
      t.string('concreting_status', 50).defaultTo('scheduled');
      t.date('concreted_at').nullable();
      
      t.string('stressing_prep_status', 50).defaultTo('pending');
      t.string('stressing_status', 50).defaultTo('pending');
      t.string('stressing_report_status', 50).defaultTo('report_balance');
      t.date('stressing_date').nullable();
      
      t.string('grouting_status', 50).defaultTo('pending');
      t.date('grouting_date').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // 3. Create project_supervisors table
  const hasSupervisors = await knex.schema.hasTable('project_supervisors');
  if (!hasSupervisors) {
    await knex.schema.createTable('project_supervisors', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
      t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      t.string('supervisor_name', 150).notNullable();
      t.string('assigned_role', 50).defaultTo('site_supervisor');
      t.string('contact_phone', 50).nullable();
      t.timestamps(true, true);
    });
  }

  // 4. Create project_drawings table
  const hasDrawings = await knex.schema.hasTable('project_drawings');
  if (!hasDrawings) {
    await knex.schema.createTable('project_drawings', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
      t.string('drawing_type', 50).defaultTo('as_built');
      t.string('level_name', 100).notNullable();
      t.string('submission_status', 50).defaultTo('to_do');
      t.date('submission_date').nullable();
      t.date('approval_date').nullable();
      t.text('file_url').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // 5. Create project_commercials table
  const hasCommercials = await knex.schema.hasTable('project_commercials');
  if (!hasCommercials) {
    await knex.schema.createTable('project_commercials', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
      t.string('claimed_slabs_text', 255).nullable();
      t.string('payment_cert_slabs_text', 255).nullable();
      t.string('pending_cert_slabs_text', 255).nullable();
      t.decimal('claimed_amount', 15, 2).defaultTo(0);
      t.decimal('certified_amount', 15, 2).defaultTo(0);
      t.string('payment_received_slabs_text', 255).nullable();
      t.decimal('received_amount', 15, 2).defaultTo(0);
      t.decimal('pdc_amount', 15, 2).defaultTo(0);
      t.string('overdue_slabs_text', 255).nullable();
      t.decimal('overdue_amount', 15, 2).defaultTo(0);
      t.string('billing_status', 50).defaultTo('up_to_date');
      t.date('last_followup_date').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('project_commercials');
  await knex.schema.dropTableIfExists('project_drawings');
  await knex.schema.dropTableIfExists('project_supervisors');
  await knex.schema.dropTableIfExists('project_slabs');
};
