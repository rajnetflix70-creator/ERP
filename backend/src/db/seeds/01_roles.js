exports.seed = async function(knex) {
  await knex('roles').insert([
    { id: 1, name: 'super_admin', description: 'Super Administrator' },
    { id: 2, name: 'company_admin', description: 'Company Administrator' },
    { id: 3, name: 'site_supervisor', description: 'Site Supervisor' },
    { id: 4, name: 'worker', description: 'Site Worker' }
  ]).onConflict('name').ignore();
};
