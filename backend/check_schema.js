const db = require('./src/db');
(async () => {
  try {
    const tables = await db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('ALL DB TABLES:');
    tables.rows.forEach(r => console.log(' -', r.table_name));

    for (const tbl of ['users','projects','sites','roles','site_assignments','equipment_machines','attendance_records','work_packages','materials','purchase_orders','invoices']) {
      try {
        const cols = await db.raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position", [tbl]);
        if (cols.rows.length === 0) { console.log('\nTABLE', tbl, '-> NOT FOUND'); continue; }
        console.log('\nCOLUMNS of', tbl + ':');
        cols.rows.forEach(c => console.log('  ', c.column_name, ':', c.data_type));
      } catch(e) { console.log('Error reading', tbl, e.message); }
    }
    process.exit(0);
  } catch(e) { console.error(e.message); process.exit(1); }
})();
