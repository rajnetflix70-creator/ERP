exports.up = function(knex) {
  return knex.schema.alterTable('equipment_machines', (table) => {
    table.string('calibration_cert_no', 100).nullable();
    table.date('calibration_expiry_date').nullable();
    table.string('paired_set_code', 50).nullable();
    table.date('last_service_date').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('equipment_machines', (table) => {
    table.dropColumn('calibration_cert_no');
    table.dropColumn('calibration_expiry_date');
    table.dropColumn('paired_set_code');
    table.dropColumn('last_service_date');
  });
};
