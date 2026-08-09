exports.up = function(knex) {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('folder_no', 20).nullable();
    table.string('ak_job_no', 30).nullable();
    table.text('project_name').notNullable();
    table.decimal('area_sqft', 12, 2).nullable();
    table.string('emirate', 50).nullable();
    table.text('supervisor_names').nullable();               // comma-separated names
    table.integer('supervisors_assigned').defaultTo(0);      // NOS(A)
    table.integer('supervisors_required').defaultTo(0);      // additional needed
    table.integer('technicians_required').defaultTo(0);
    table.integer('supervisors_available_march').defaultTo(0);
    table.string('status', 30).defaultTo('pending')          // pending|active|needs_supervisor|completed|grouting_pending|stopped|strengthening
      .checkIn(['pending','active','needs_supervisor','completed','grouting_pending','stopped','strengthening']);
    table.boolean('has_stressing_machine').defaultTo(false);
    table.boolean('has_onion_machine').defaultTo(false);
    table.boolean('has_gun_machine').defaultTo(false);
    table.boolean('has_grouting_machine').defaultTo(false);
    table.text('notes').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('projects');
};
