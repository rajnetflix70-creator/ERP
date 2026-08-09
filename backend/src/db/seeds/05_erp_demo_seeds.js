exports.seed = async function(knex) {
  // 1. Seed Operators
  const existingOperators = await knex('operators').count('* as count').first();
  if (parseInt(existingOperators.count, 10) === 0) {
    await knex('operators').insert([
      {
        employee_id: 'OP-1001',
        name: 'Mohammed Al-Suwaidi',
        mobile: '+971 50 123 4567',
        license_number: 'UAE-LIC-88492',
        license_type: 'Heavy Equipment & Crane',
        license_expiry: '2027-05-15',
        status: 'active'
      },
      {
        employee_id: 'OP-1002',
        name: 'Rashid Khan',
        mobile: '+971 55 987 6543',
        license_number: 'UAE-LIC-55102',
        license_type: 'Stressing Machine Operator',
        license_expiry: '2026-11-20',
        status: 'active'
      },
      {
        employee_id: 'OP-1003',
        name: 'Senthil Kumar',
        mobile: '+971 52 444 1122',
        license_number: 'UAE-LIC-33910',
        license_type: 'Grouting & Hydraulic Specialist',
        license_expiry: '2026-09-10',
        status: 'active'
      },
      {
        employee_id: 'OP-1004',
        name: 'Vikram Singh',
        mobile: '+971 54 333 8899',
        license_number: 'UAE-LIC-11928',
        license_type: 'General Machinery',
        license_expiry: '2026-03-01', // Expiring soon (< 30 days)
        status: 'active'
      }
    ]);
  }

  // 2. Seed Vendors
  const existingVendors = await knex('vendors').count('* as count').first();
  let vendorId1, vendorId2;
  if (parseInt(existingVendors.count, 10) === 0) {
    const vendors = await knex('vendors').insert([
      {
        vendor_name: 'Al Habtoor Heavy Machinery Rentals',
        vendor_type: 'Equipment Rental',
        contact_person: 'Tariq Mansoor',
        mobile: '+971 4 333 1111',
        email: 'rentals@alhabtoormachinery.ae',
        address: 'Al Quoz Industrial 3, Dubai',
        equipment_service: 'Hydraulic Jacks, Stressing Pumps, Concrete Cutters',
        status: 'active'
      },
      {
        vendor_name: 'Emirates Hydraulic & Service Corp',
        vendor_type: 'Maintenance',
        contact_person: 'John Smith',
        mobile: '+971 4 888 2222',
        email: 'service@emirateshydraulic.ae',
        address: 'Jebel Ali Freezone, Dubai',
        equipment_service: 'Pressure Gauge Calibration, Pump Repairs',
        status: 'active'
      },
      {
        vendor_name: 'Gulf Transport & Logistics L.L.C',
        vendor_type: 'Transport',
        contact_person: 'Faisal Ahmed',
        mobile: '+971 6 555 9900',
        email: 'logistics@gulftransport.ae',
        address: 'Industrial Area 13, Sharjah',
        equipment_service: 'Heavy Trailer Site Transfer',
        status: 'active'
      }
    ]).returning('id');
    vendorId1 = vendors[0]?.id;
    vendorId2 = vendors[1]?.id;
  } else {
    const vList = await knex('vendors').limit(2);
    vendorId1 = vList[0]?.id;
    vendorId2 = vList[1]?.id;
  }

  // Get demo machines & sites
  const machines = await knex('equipment_machines').limit(5);
  const projects = await knex('projects').limit(5);

  if (machines.length > 0) {
    const m1 = machines[0];
    const m2 = machines[1] || machines[0];
    const p1 = projects[0];
    const p2 = projects[1] || projects[0];

    // 3. Seed Maintenance Records
    const existingMaintenance = await knex('maintenance_records').count('* as count').first();
    if (parseInt(existingMaintenance.count, 10) === 0) {
      await knex('maintenance_records').insert([
        {
          machine_id: m1.id,
          maintenance_type: 'Preventive Maintenance',
          service_date: '2026-01-15',
          meter_reading: 420.50,
          problem_description: 'Scheduled 500-hour hydraulic fluid change and seal check.',
          work_performed: 'Replaced hydraulic oil, changed high-pressure seals, calibrated pressure gauge.',
          vendor_id: vendorId2,
          technician: 'Eng. Hassan Raza',
          parts_used: 'Hydraulic Fluid 46 (20L), Seal Kit #9000CU1R',
          labor_cost: 450.00,
          parts_cost: 850.00,
          total_cost: 1300.00,
          next_service_date: '2026-04-15',
          next_service_meter: 920.00,
          status: 'Completed',
          remarks: 'Machine passed hydrostatic test cleanly.'
        },
        {
          machine_id: m2.id,
          maintenance_type: 'Inspection',
          service_date: '2026-02-01',
          meter_reading: 180.00,
          problem_description: 'Routine pressure gauge calibration for AK site inspection.',
          work_performed: 'Recalibrated digital gauge to ±0.5% accuracy standards.',
          vendor_id: vendorId2,
          technician: 'Tech. Suresh',
          parts_used: 'Calibration Certificate Tag',
          labor_cost: 300.00,
          parts_cost: 150.00,
          total_cost: 450.00,
          next_service_date: '2026-05-01',
          next_service_meter: 680.00,
          status: 'Completed',
          remarks: 'Certificate issued valid for 6 months.'
        }
      ]);
    }

    // 4. Seed Breakdown Records
    const existingBreakdowns = await knex('breakdown_records').count('* as count').first();
    if (parseInt(existingBreakdowns.count, 10) === 0) {
      await knex('breakdown_records').insert([
        {
          machine_id: m1.id,
          breakdown_date: '2026-02-05',
          site_id: p1 ? p1.id : null,
          breakdown_type: 'Hydraulic Hose Rupture',
          problem_description: 'High pressure line burst during post-tensioning operation on 14th floor.',
          priority: 'High',
          reported_by: 'Supervisor Manikandan',
          assigned_technician: 'Eng. Hassan Raza',
          downtime_hours: 4.5,
          repair_cost: 650.00,
          resolution: 'Replaced 10,000 PSI high pressure hydraulic hose and bled system.',
          status: 'Resolved',
          remarks: 'Work resumed at site without further delay.'
        }
      ]);
    }

    // 5. Seed Equipment Documents (Including Expiring < 30 days)
    const existingDocs = await knex('equipment_documents').count('* as count').first();
    if (parseInt(existingDocs.count, 10) === 0) {
      await knex('equipment_documents').insert([
        {
          machine_id: m1.id,
          document_type: 'Calibration Certificate',
          document_number: 'CAL-2026-9901',
          issue_date: '2025-08-15',
          expiry_date: '2026-08-15',
          status: 'Valid',
          notes: 'ISO 17025 Certified'
        },
        {
          machine_id: m1.id,
          document_type: 'Fitness Certificate',
          document_number: 'FIT-DUBAI-4412',
          issue_date: '2025-03-01',
          expiry_date: '2026-03-01', // Expiring in 20 days!
          status: 'Expiring Soon',
          notes: 'Renewal application submitted to RTA/Dubai Municipality'
        },
        {
          machine_id: m2.id,
          document_type: 'Insurance Policy',
          document_number: 'INS-GULF-88721',
          issue_date: '2025-02-28',
          expiry_date: '2026-02-28', // Expiring in 19 days!
          status: 'Expiring Soon',
          notes: 'Covered under Comprehensive Equipment All Risks'
        }
      ]);
    }

    // 6. Seed Notifications
    const existingNotifs = await knex('notifications').count('* as count').first();
    if (parseInt(existingNotifs.count, 10) === 0) {
      await knex('notifications').insert([
        {
          title: 'Fitness Certificate Expiring Soon',
          message: `Equipment Jack/Pump #${m1.machine_no || '16(2403009)'} Fitness Certificate expires on 2026-03-01.`,
          type: 'Document Expiring',
          is_read: false
        },
        {
          title: 'Insurance Policy Renewal Required',
          message: `Equipment #${m2.machine_no || '20(2403003)'} Insurance Policy expires in 19 days.`,
          type: 'Document Expiring',
          is_read: false
        },
        {
          title: 'Equipment Transfer Request',
          message: 'Transfer requested for Grouting Machine from Pelagos Store to Site 309.LUXRIDGE.',
          type: 'Transfer Request',
          is_read: false
        }
      ]);
    }
  }

  console.log('✅ ERP Demo Seeds (Operators, Vendors, Maintenance, Documents, Breakdowns, Notifications) applied!');
};
