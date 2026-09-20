const service = require('../backend/src/modules/projects/service');
const db = require('../backend/src/db');

async function test() {
  console.log('Testing PT Projects API Services...');
  
  // 1. Get list of projects
  const projects = await service.listProjects();
  console.log(`Found ${projects.length} existing projects.`);
  
  let targetId;
  if (projects.length > 0) {
    targetId = projects[0].id;
  } else {
    const newPrj = await service.createProject({
      project_name: 'Test PT Tower',
      folder_no: 'F-101',
      ak_job_no: 'AK-24-999',
      plot_no: 'PLOT-888',
      tender_net_area: 50000,
      total_slabs_count: 10,
      status: 'active'
    });
    targetId = newPrj.id;
    console.log(`Created test project ID: ${targetId}`);
  }

  // 2. Add / update slabs
  const slab1 = await service.upsertSlab(targetId, {
    floor_name: 'GF',
    floor_order: 1,
    area_sqft: 5000,
    concreting_status: 'done',
    concreted_at: '2026-05-10',
    stressing_status: 'completed',
    grouting_status: 'completed'
  });
  console.log('Upserted Slab 1:', slab1.floor_name, slab1.id);

  const slab2 = await service.upsertSlab(targetId, {
    floor_name: 'L1',
    floor_order: 2,
    area_sqft: 4800,
    concreting_status: 'scheduled',
    stressing_status: 'pending'
  });
  console.log('Upserted Slab 2:', slab2.floor_name, slab2.id);

  // 3. Add drawing
  const drawing = await service.createDrawing(targetId, {
    drawing_type: 'as_built',
    level_name: 'GF & L1',
    submission_status: 'approved',
    submission_date: '2026-05-15'
  });
  console.log('Created Drawing:', drawing.level_name, drawing.submission_status);

  // 4. Add supervisor
  const supervisor = await service.addSupervisor(targetId, {
    supervisor_name: 'John Doe',
    assigned_role: 'site_supervisor',
    contact_phone: '+971500000000'
  });
  console.log('Added Supervisor:', supervisor.supervisor_name);

  // 5. Commercials
  const comm = await service.upsertCommercials(targetId, {
    claimed_slabs_text: 'GF, L1',
    claimed_amount: 150000,
    certified_amount: 140000,
    received_amount: 100000,
    billing_status: 'up_to_date'
  });
  console.log('Upserted Commercials:', comm.claimed_slabs_text, comm.claimed_amount);

  // 6. Fetch full details
  const details = await service.getProjectWithDetails(targetId);
  console.log(`\n--- Project Details (${details.project_name}) ---`);
  console.log(`Slabs count: ${details.slabs.length}`);
  console.log(`Drawings count: ${details.drawings.length}`);
  console.log(`Supervisors count: ${details.supervisors.length}`);
  console.log(`Commercial record present: ${!!details.commercials}`);

  console.log('\nSUCCESS: All PT endpoints test passed cleanly!');
  process.exit(0);
}

test().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
