exports.up = async function(knex) {
  // Employee Wages Table
  await knex.schema.createTable('employee_wages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('daily_rate', 10, 2).defaultTo(0);
    table.decimal('ot_rate_per_hour', 10, 2).defaultTo(0);
    table.date('effective_from').notNullable();
    table.timestamps(true, true);
  });

  // Payroll Summaries Table
  await knex.schema.createTable('payroll_summaries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('period_month', 10).notNullable(); // YYYY-MM
    table.decimal('total_days_present', 5, 2).defaultTo(0);
    table.decimal('total_ot_hours', 5, 2).defaultTo(0);
    table.decimal('gross_pay', 12, 2).defaultTo(0);
    table.decimal('deductions', 12, 2).defaultTo(0);
    table.decimal('net_pay', 12, 2).defaultTo(0);
    table.timestamp('generated_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'period_month']); // One summary per user per month
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('payroll_summaries');
  await knex.schema.dropTableIfExists('employee_wages');
};
