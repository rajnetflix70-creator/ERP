exports.up = async function(knex) {
  // Work packages — task breakdown per project
  await knex.schema.createTable('work_packages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('site_id').nullable().references('id').inTable('sites').onDelete('SET NULL');
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.string('status', 30).defaultTo('not_started'); // not_started, in_progress, completed, blocked, delayed
    table.string('priority', 20).defaultTo('medium');    // low, medium, high, critical
    table.uuid('assigned_to').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.date('planned_start').nullable();
    table.date('planned_end').nullable();
    table.date('actual_start').nullable();
    table.date('actual_end').nullable();
    table.decimal('completion_pct', 5, 2).defaultTo(0);
    table.text('blocked_reason').nullable();
    table.timestamps(true, true);
  });

  // Daily progress logs — per work package
  await knex.schema.createTable('daily_progress_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('work_package_id').notNullable().references('id').inTable('work_packages').onDelete('CASCADE');
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('logged_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.date('log_date').notNullable();
    table.text('work_description').notNullable();
    table.decimal('qty_completed', 10, 2).nullable();
    table.string('qty_unit', 30).nullable();        // sqft, meters, nos, bags, etc.
    table.decimal('completion_pct', 5, 2).nullable(); // new % after this log
    table.string('status_after', 30).nullable();    // status set after this log
    table.text('issues_encountered').nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('daily_progress_logs');
  await knex.schema.dropTableIfExists('work_packages');
};
