exports.up = async function(knex) {
  // 1. Create operators table
  await knex.schema.createTable('operators', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('employee_id', 50).unique().notNullable();
    table.string('name', 150).notNullable();
    table.string('mobile', 50).nullable();
    table.string('license_number', 100).nullable();
    table.string('license_type', 100).nullable(); // Heavy Equipment, Crane, Forklift, General
    table.date('license_expiry').nullable();
    table.uuid('assigned_machine_id').nullable().references('id').inTable('equipment_machines').onDelete('SET NULL');
    table.string('status', 30).defaultTo('active'); // active, on_leave, inactive
    table.timestamps(true, true);
  });

  // 2. Create vendors table
  await knex.schema.createTable('vendors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('vendor_name', 150).notNullable();
    table.string('vendor_type', 50).notNullable(); // Rental, Maintenance, Spare Parts, Transport
    table.string('contact_person', 100).nullable();
    table.string('mobile', 50).nullable();
    table.string('email', 100).nullable();
    table.text('address').nullable();
    table.string('equipment_service', 200).nullable();
    table.string('status', 30).defaultTo('active');
    table.timestamps(true, true);
  });

  // 3. Create equipment_movements table (Transfer requests & logs)
  await knex.schema.createTable('equipment_movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').notNullable().references('id').inTable('equipment_machines').onDelete('CASCADE');
    table.uuid('from_site_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('to_site_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.string('from_location_name', 200).nullable();
    table.string('to_location_name', 200).nullable();
    table.date('transfer_date').notNullable();
    table.text('transfer_reason').nullable();
    table.decimal('meter_reading', 10, 2).defaultTo(0);
    table.string('transport_details', 255).nullable();
    table.string('handover_person', 100).nullable();
    table.string('receiving_person', 100).nullable();
    table.string('status', 50).defaultTo('Transfer Requested'); // Transfer Requested, Approved, In Transit, Received, Completed
    table.uuid('requested_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('remarks').nullable();
    table.timestamps(true, true);
  });

  // 4. Create maintenance_records table
  await knex.schema.createTable('maintenance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').notNullable().references('id').inTable('equipment_machines').onDelete('CASCADE');
    table.string('maintenance_type', 50).notNullable(); // Preventive Maintenance, Corrective Maintenance, Breakdown, Inspection, General Service
    table.date('service_date').notNullable();
    table.decimal('meter_reading', 10, 2).defaultTo(0);
    table.text('problem_description').nullable();
    table.text('work_performed').nullable();
    table.uuid('vendor_id').nullable().references('id').inTable('vendors').onDelete('SET NULL');
    table.string('technician', 100).nullable();
    table.text('parts_used').nullable();
    table.decimal('labor_cost', 12, 2).defaultTo(0);
    table.decimal('parts_cost', 12, 2).defaultTo(0);
    table.decimal('total_cost', 12, 2).defaultTo(0);
    table.date('next_service_date').nullable();
    table.decimal('next_service_meter', 10, 2).nullable();
    table.string('status', 30).defaultTo('Completed'); // Upcoming, Due, In Progress, Completed
    table.text('remarks').nullable();
    table.timestamps(true, true);
  });

  // 5. Create breakdown_records table
  await knex.schema.createTable('breakdown_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').notNullable().references('id').inTable('equipment_machines').onDelete('CASCADE');
    table.date('breakdown_date').notNullable();
    table.uuid('site_id').nullable().references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('operator_id').nullable().references('id').inTable('operators').onDelete('SET NULL');
    table.string('breakdown_type', 100).nullable();
    table.text('problem_description').notNullable();
    table.string('priority', 20).defaultTo('Medium'); // Low, Medium, High, Critical
    table.string('reported_by', 100).nullable();
    table.string('assigned_technician', 100).nullable();
    table.timestamp('repair_start').nullable();
    table.timestamp('repair_end').nullable();
    table.decimal('downtime_hours', 8, 2).defaultTo(0);
    table.decimal('repair_cost', 12, 2).defaultTo(0);
    table.text('resolution').nullable();
    table.string('status', 30).defaultTo('Open'); // Open, In Progress, Resolved, Closed
    table.text('remarks').nullable();
    table.timestamps(true, true);
  });

  // 6. Create equipment_documents table
  await knex.schema.createTable('equipment_documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').notNullable().references('id').inTable('equipment_machines').onDelete('CASCADE');
    table.string('document_type', 50).notNullable(); // RC, Insurance, Fitness Certificate, Pollution Certificate, Permit, Calibration Certificate, Rental Agreement, Other
    table.string('document_number', 100).nullable();
    table.date('issue_date').nullable();
    table.date('expiry_date').notNullable();
    table.string('file_url', 255).nullable();
    table.string('status', 30).defaultTo('Valid'); // Valid, Expiring Soon, Expired
    table.text('notes').nullable();
    table.timestamps(true, true);
  });

  // 7. Create notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title', 150).notNullable();
    table.text('message').notNullable();
    table.string('type', 50).notNullable(); // Maintenance Due, Document Expiring, Document Expired, Breakdown, Transfer Request, Allocation
    table.boolean('is_read').defaultTo(false);
    table.uuid('target_user_id').nullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('link', 255).nullable();
    table.timestamps(true, true);
  });

  // 8. Create activity_logs table
  await knex.schema.createTable('activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').nullable().references('id').inTable('equipment_machines').onDelete('SET NULL');
    table.string('activity', 255).notNullable();
    table.string('site_name', 200).nullable();
    table.string('user_name', 100).nullable();
    table.text('details').nullable();
    table.timestamps(true, true);
  });

  // 9. Extend equipment_daily_logs with detailed metrics
  await knex.schema.table('equipment_daily_logs', (table) => {
    table.uuid('operator_id').nullable().references('id').inTable('operators').onDelete('SET NULL');
    table.decimal('start_meter', 10, 2).defaultTo(0);
    table.decimal('end_meter', 10, 2).defaultTo(0);
    table.decimal('total_hours', 8, 2).defaultTo(0);
    table.decimal('working_hours', 8, 2).defaultTo(0);
    table.decimal('idle_hours', 8, 2).defaultTo(0);
    table.decimal('fuel_used', 8, 2).defaultTo(0);
    table.text('work_description').nullable();
    table.text('remarks').nullable();
  });

  // 10. Extend equipment_machines with technical & registration details
  await knex.schema.table('equipment_machines', (table) => {
    table.string('equipment_code', 50).nullable();
    table.string('equipment_name', 150).nullable();
    table.string('make', 100).nullable();
    table.string('model', 100).nullable();
    table.string('registration_no', 100).nullable();
    table.string('ownership', 30).defaultTo('owned'); // owned, rental, leased
    table.uuid('vendor_id').nullable().references('id').inTable('vendors').onDelete('SET NULL');
    table.decimal('purchase_cost', 12, 2).nullable();
    table.decimal('rental_cost', 12, 2).nullable();
    table.date('rental_start_date').nullable();
    table.date('rental_end_date').nullable();
    table.string('engine_number', 100).nullable();
    table.string('chassis_number', 100).nullable();
    table.string('capacity', 100).nullable();
    table.string('fuel_type', 50).nullable(); // Diesel, Petrol, Electric
    table.integer('year_manufacture').nullable();
    table.string('meter_type', 30).defaultTo('hours'); // hours, km
    table.decimal('current_meter', 10, 2).defaultTo(0);
    table.uuid('current_operator_id').nullable().references('id').inTable('operators').onDelete('SET NULL');
    table.date('last_maintenance_date').nullable();
    table.date('next_maintenance_date').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('activity_logs');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('equipment_documents');
  await knex.schema.dropTableIfExists('breakdown_records');
  await knex.schema.dropTableIfExists('maintenance_records');
  await knex.schema.dropTableIfExists('equipment_movements');
  await knex.schema.dropTableIfExists('vendors');
  await knex.schema.dropTableIfExists('operators');
};
