const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  const hash = await bcrypt.hash('Admin@1234', 10);
  
  // Clean existing logic (optional, skip delete to preserve id sequences if not needed)
  // For safety on multiple runs, we'll use onConflict or just try inserting and catch errors.
  // Instead of complex logic, we'll first check if data exists.
  
  const superAdmin = await knex('users').where({ email: 'super_admin@sitetrack.ae' }).first();
  if (superAdmin) return; // Skip if already seeded
  
  const [admin] = await knex('users').insert({
    full_name: 'Super Admin',
    email: 'super_admin@sitetrack.ae',
    password_hash: hash,
    email_verified: true,
    role_id: 1
  }).returning('id');

  const [companyAdmin] = await knex('users').insert({
    full_name: 'Company Admin',
    email: 'admin@sitetrack.ae',
    password_hash: hash,
    role_id: 2
  }).returning('id');

  const [supervisor] = await knex('users').insert({
    full_name: 'Site Supervisor',
    email: 'supervisor@sitetrack.ae',
    password_hash: hash,
    role_id: 3
  }).returning('id');

  const [worker] = await knex('users').insert({
    full_name: 'Site Worker',
    email: 'worker@sitetrack.ae',
    password_hash: hash,
    role_id: 4
  }).returning('id');

  const [site] = await knex('sites').insert({
    name: 'Dubai Marina Tower Site',
    code: 'DXB-001',
    emirate: 'Dubai',
    latitude: 25.0802,
    longitude: 55.1402,
    geofence_radius_meters: 300,
    supervisor_id: supervisor.id
  }).returning('id');

  await knex('site_assignments').insert([
    { user_id: supervisor.id, site_id: site.id, assigned_from: knex.fn.now() },
    { user_id: worker.id, site_id: site.id, assigned_from: knex.fn.now() }
  ]);

  const [crane] = await knex('equipment_items').insert({
    name: 'Tower Crane',
    category_id: 1, // Heavy Machinery
    item_type: 'asset',
    unit: 'piece',
    total_quantity: 1
  }).returning('id');

  const [cement] = await knex('equipment_items').insert({
    name: 'Portland Cement',
    category_id: 4, // Consumables
    item_type: 'consumable',
    unit: 'bag',
    reorder_level: 50,
    total_quantity: 200
  }).returning('id');

  await knex('equipment_site_allocations').insert([
    { equipment_item_id: crane.id, site_id: site.id, quantity: 1 },
    { equipment_item_id: cement.id, site_id: site.id, quantity: 100 }
  ]);
};
