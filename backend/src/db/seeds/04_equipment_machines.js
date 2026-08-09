/**
 * Seed: 04_equipment_machines.js
 * Seeds all 89 heavy machine units (Stressing, Flower, Grouting) and auxiliary tools
 * extracted from Sheet 3 of "PROJECT LIST AND SUPERVISOR REQUIREMENT (1).xlsx"
 * with realistic ISO Calibration Certificate data and hardware set pairing codes.
 */

const STRESSING_MACHINES = [
  { brand: 'CHINESE', jack_no: '-', pump_no: '16(2403009)', pressure_gauge_no: '9000CU1R', current_location_name: 'PELAGOS STORE', condition_remarks: 'Pump & Jack' },
  { brand: 'CHINESE', jack_no: '20', pump_no: '17(2311022)', pressure_gauge_no: '9007X6YF', current_location_name: 'ABDUL AZIZ STORE', condition_remarks: 'Pump only, Jack in Pelagos' },
  { brand: 'CHINESE', jack_no: '-', pump_no: '18(2403005)', pressure_gauge_no: '9007X6YI', current_location_name: 'PELAGOS STORE', condition_remarks: 'Pump & Jack' },
  { brand: 'CHINESE', jack_no: '19', pump_no: '19(2403015)', pressure_gauge_no: '9000REU8', current_location_name: 'ABDUL AZIZ STORE', condition_remarks: 'Pump only, Jack in Indo Janus' },
  { brand: 'CHINESE', jack_no: '18', pump_no: '20 (2403003)', pressure_gauge_no: '9007X6YI', current_location_name: '299.ACUBE', condition_remarks: '' },
  { brand: 'CHINESE', jack_no: '26', pump_no: '21(2403007)', pressure_gauge_no: '9002SF7W', current_location_name: 'ABDUL AZIZ STORE', condition_remarks: 'Pump only, Jack in Pelagos' },
  { brand: 'CHINESE', jack_no: '22', pump_no: '22 (2403019)', pressure_gauge_no: '013526255 (10)', current_location_name: '317.NAF WARSAN', condition_remarks: 'Pump only, Jack in Indo G+10' },
  { brand: 'CHINESE', jack_no: '23', pump_no: '23(2403010)', pressure_gauge_no: '9007X6YQ', current_location_name: 'ABDUL AZIZ STORE', condition_remarks: '' },
  { brand: 'CHINESE', jack_no: '24', pump_no: '24(2403016)', pressure_gauge_no: '9002SF7C', current_location_name: 'ABDUL AZIZ AL MAJID', condition_remarks: '' },
  { brand: 'CHINESE', jack_no: '25', pump_no: '25(2403006)', pressure_gauge_no: '9004F0FX', current_location_name: 'PIVOT AUH', condition_remarks: '' },
  { brand: 'CHINESE', jack_no: '-', pump_no: '-2306016', pressure_gauge_no: '9000REV3', current_location_name: 'SKADA(ARAB)', condition_remarks: 'Pump only, Jack in Al Masaood' },
  { brand: 'CHINESE(NEW)', jack_no: '21', pump_no: '26(2504011)', pressure_gauge_no: 'NO NUMBER', current_location_name: 'AL MAERAJ BARARI', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '27', pump_no: '27(2504001)', pressure_gauge_no: 'NO NUMBER', current_location_name: '317.NAF BARARI', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '28', pump_no: '28(2504009)', pressure_gauge_no: 'NO NUMBER', current_location_name: 'PIVOT AUH', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '2504015', pressure_gauge_no: 'NO NUMBER', current_location_name: '183.MODERN ARJAN', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '2504003', pressure_gauge_no: 'NO NUMBER', current_location_name: '302.SHAANXI', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '31', pump_no: '31(2504018)', pressure_gauge_no: 'NO NUMBER', current_location_name: '249.AL SHAFAR SATWA', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '2504008', pressure_gauge_no: 'NO NUMBER', current_location_name: 'AL RABAT', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '32', pump_no: '32(2504013)', pressure_gauge_no: 'NO NUMBER', current_location_name: '239.ITEC', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '2504014', pressure_gauge_no: 'NO NUMBER', current_location_name: '250.LUMINAR 2', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '-', pressure_gauge_no: '-', current_location_name: 'TYCOON STORE', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '-', pressure_gauge_no: '-', current_location_name: 'TYCOON STORE', condition_remarks: '' },
  { brand: 'CHINESE(NEW)', jack_no: '-', pump_no: '-', pressure_gauge_no: '-', current_location_name: 'TYCOON STORE', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '15(9)(57848-9)', pump_no: '11(384689)', pressure_gauge_no: '9007X6W0', current_location_name: '121.JULFAR', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '04(12253.8)', pump_no: '12(390064)', pressure_gauge_no: '90268131', current_location_name: '311.AL MASAOOD', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '57848-12', pump_no: '13(389275)', pressure_gauge_no: '9007X6XE', current_location_name: '175.TIGER VOLGHA', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '15(57848-13)', pump_no: '14(383911)', pressure_gauge_no: '9007X6YH', current_location_name: '250.LUMINAR 2', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '15(14935.1)', pump_no: '15(391874)', pressure_gauge_no: '9007X6XW', current_location_name: 'PIVOT AUH', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '-13697.8', pump_no: '16(391867)', pressure_gauge_no: '9002SF7A', current_location_name: 'TIGER RENAD', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '18(57848-7)', pump_no: '-371198', pressure_gauge_no: '9002SF7D', current_location_name: 'LUXRIDGE', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '16(15326.4)', pump_no: '-', pressure_gauge_no: '9000REU2', current_location_name: 'LAMIDA CONT', condition_remarks: '' },
  { brand: 'POWER TEAM', jack_no: '-', pump_no: '-325497', pressure_gauge_no: '-', current_location_name: 'NAF WARSAN', condition_remarks: 'Pump only, Jack in Pivot AUH' },
  { brand: 'POWER TEAM', jack_no: '-', pump_no: 'AK-SP-01', pressure_gauge_no: '-', current_location_name: 'MISSING', condition_remarks: 'Missing Unit', status: 'missing' },
  { brand: 'RALLY', jack_no: '57995.15', pump_no: '23127632', pressure_gauge_no: 'EN837-1', current_location_name: 'MODERN DUBAILAND', condition_remarks: '' },
  { brand: 'RALLY', jack_no: '13697.6', pump_no: '23127635', pressure_gauge_no: '9000RHOQ', current_location_name: '193.INDOGULF G+10', condition_remarks: '' },
  { brand: 'RALLY', jack_no: '-', pump_no: '25021192', pressure_gauge_no: '-', current_location_name: 'PIVOT AUH', condition_remarks: 'Pump only, Jack in Pelagos' },
  { brand: 'INDIA(SUBRAMANIYAN)', jack_no: '-', pump_no: '15', pressure_gauge_no: 'EN837-1', current_location_name: '193.INDOGULF G+10', condition_remarks: 'Pump only, Jack in Ras Al Khor' },
  { brand: 'INDIA(KANWAR)', jack_no: '90.25.8.1', pump_no: '25.8.1', pressure_gauge_no: 'L.0032.0016', current_location_name: 'INDO GULF NAAD AL SHIBA', condition_remarks: 'Pump only, Jack in Pelagos' },
];

const FLOWER_MACHINES = [
  { brand: 'RALLY', pump_no: 'B5060305', pressure_gauge_no: '24080618', current_location_name: '151.ABDUL AZIZ' },
  { brand: 'RALLY', pump_no: 'KSP-25S', pressure_gauge_no: '', current_location_name: '162.TIGER RENAD' },
  { brand: 'RALLY', pump_no: 'ksp-25S', pressure_gauge_no: '', current_location_name: 'AL RABAT' },
  { brand: 'RALLY', pump_no: '87202', pressure_gauge_no: '', current_location_name: 'ACUBE' },
  { brand: 'RALLY', pump_no: '(3)87201', pressure_gauge_no: '', current_location_name: 'ABDUL AZIZ STORE', condition_remarks: 'Pump only, Jack in Shine Square' },
  { brand: 'RALLY', jack_no: '10', pump_no: 'B5060303', pressure_gauge_no: '', current_location_name: '259.ITAL PORTOFINO' },
  { brand: 'RALLY', jack_no: '9', pump_no: '-', pressure_gauge_no: '', current_location_name: 'ABDUL AZIZ STORE' },
  { brand: 'RALLY', pump_no: 'B4061208', pressure_gauge_no: '', current_location_name: '309.LUXRIDGE' },
  { brand: 'RALLY', pump_no: 'B4061202', pressure_gauge_no: '', current_location_name: 'HIKMA/NAJ' },
  { brand: 'RALLY', pump_no: 'B4061206', pressure_gauge_no: '', current_location_name: 'TAK 35' },
  { brand: 'RALLY', pump_no: 'B5060313', pressure_gauge_no: '', current_location_name: '260.LAMIDA' },
  { brand: 'RALLY', pump_no: '-', pressure_gauge_no: '', current_location_name: 'MODERN DUBAILAND' },
  { brand: 'RALLY', pump_no: 'B4061204', pressure_gauge_no: '', current_location_name: '249.AL SHAFAR SATWA' },
  { brand: 'RALLY', pump_no: 'B4061201', pressure_gauge_no: '', current_location_name: 'ABDUL AZIZ STORE' },
  { brand: 'RALLY', pump_no: 'B4061203', pressure_gauge_no: '', current_location_name: '317.NAF BARARI' },
  { brand: 'RALLY', pump_no: 'B4061207', pressure_gauge_no: '', current_location_name: '311.AL MASAOOD' },
  { brand: 'RALLY', pump_no: 'B4061205', pressure_gauge_no: '', current_location_name: '317.NAF WARSAN' },
  { brand: 'POWER TEAM', pump_no: '383912', pressure_gauge_no: '', current_location_name: '250.LUMINAR 2' },
  { brand: 'POWER TEAM', pump_no: '371206', pressure_gauge_no: '', current_location_name: 'ABDUL AZIZ STORE' },
  { brand: 'POWER TEAM', pump_no: '383910', pressure_gauge_no: '', current_location_name: 'ABDUL AZIZ STORE' },
  { brand: 'POWER TEAM', pump_no: '391866', pressure_gauge_no: '', current_location_name: '302.SHAANXI' },
  { brand: 'POWER TEAM', pump_no: '389278', pressure_gauge_no: '', current_location_name: 'PIVOT AUH' },
  { brand: 'INDIA BRANDS', pump_no: 'AK-FLW-01', pressure_gauge_no: '', current_location_name: 'AL MAERAJ BARARI' },
  { brand: 'INDIA BRANDS', pump_no: 'AK-FLW-02', pressure_gauge_no: '', current_location_name: '239.ITEC' },
  { brand: 'INDIA BRANDS', pump_no: 'AK-FLW-03', pressure_gauge_no: '', current_location_name: '175.TIGER VOLGHA' },
];

const GROUTING_MACHINES = [
  { machine_no: '01', motor_no: '24044103', current_location_name: '151.ABDUL AZIZ' },
  { machine_no: '02', motor_no: '24044093', current_location_name: 'ABDUL AZIZ STORE' },
  { machine_no: '03', motor_no: '24044094', current_location_name: 'ABDUL AZIZ STORE' },
  { machine_no: '04', motor_no: '24044097', current_location_name: '309.LUXRIDGE' },
  { machine_no: '05', motor_no: '24044101', current_location_name: '317.NAF BARARI' },
  { machine_no: '06', motor_no: '24044104', current_location_name: 'PIVOT AUH' },
  { machine_no: '07', motor_no: '24044096', current_location_name: '162.TIGER RENAD' },
  { machine_no: '08', motor_no: '24044099', current_location_name: 'PELAGOS STORE' },
  { machine_no: '09', motor_no: '24044098', current_location_name: '250.LUMINAR 2' },
  { machine_no: '10', motor_no: '24044095', current_location_name: '311.AL MASAOOD' },
  { machine_no: '11', motor_no: '24044102', current_location_name: 'PELAGOS STORE' },
  { machine_no: '12', motor_no: '24044100', current_location_name: 'TYCOON STORE' },
];

exports.seed = async function(knex) {
  // Clear existing
  await knex('equipment_daily_logs').del();
  await knex('equipment_machines').del();

  const machineRows = [];

  // Helper for generating calibration cert & expiry
  const getCalib = (idx) => {
    // 70% Valid (expires late 2026/2027)
    // 15% Expiring soon (expires within 10-25 days)
    // 15% Expired (expired 15-45 days ago)
    const cert = `CERT-ISO-${202500 + idx}`;
    let expiry;
    if (idx % 7 === 0) {
      // Expired 20 days ago
      const d = new Date();
      d.setDate(d.getDate() - 20);
      expiry = d.toISOString().slice(0, 10);
    } else if (idx % 5 === 0) {
      // Expiring in 15 days
      const d = new Date();
      d.setDate(d.getDate() + 15);
      expiry = d.toISOString().slice(0, 10);
    } else {
      // Valid for 6-12 months
      const d = new Date();
      d.setMonth(d.getMonth() + (idx % 8 + 4));
      expiry = d.toISOString().slice(0, 10);
    }
    return { cert, expiry };
  };

  // 1. Stressing Machines
  STRESSING_MACHINES.forEach((m, i) => {
    const cal = getCalib(i + 1);
    machineRows.push({
      machine_type: 'stressing',
      brand: m.brand,
      machine_no: `STR-${String(i + 1).padStart(3, '0')}`,
      jack_no: m.jack_no || null,
      pump_no: m.pump_no || null,
      pressure_gauge_no: m.pressure_gauge_no || null,
      current_location_name: m.current_location_name || 'PELAGOS STORE',
      condition_remarks: m.condition_remarks || null,
      status: m.status || 'deployed',
      calibration_cert_no: cal.cert,
      calibration_expiry_date: cal.expiry,
      paired_set_code: `SET-STR-${String(i + 1).padStart(2, '0')}`,
      is_active: true,
    });
  });

  // 2. Flower Machines
  FLOWER_MACHINES.forEach((m, i) => {
    const cal = getCalib(i + 50);
    machineRows.push({
      machine_type: 'flower',
      brand: m.brand,
      machine_no: `FLW-${String(i + 1).padStart(3, '0')}`,
      jack_no: m.jack_no || null,
      pump_no: m.pump_no || null,
      pressure_gauge_no: m.pressure_gauge_no || null,
      current_location_name: m.current_location_name || 'ABDUL AZIZ STORE',
      condition_remarks: m.condition_remarks || null,
      status: 'deployed',
      calibration_cert_no: cal.cert,
      calibration_expiry_date: cal.expiry,
      paired_set_code: `SET-FLW-${String(i + 1).padStart(2, '0')}`,
      is_active: true,
    });
  });

  // 3. Grouting Machines
  GROUTING_MACHINES.forEach((m, i) => {
    const cal = getCalib(i + 80);
    machineRows.push({
      machine_type: 'grouting',
      brand: 'GROUTING MACHINE',
      machine_no: m.machine_no ? `GRT-${m.machine_no}` : `GRT-${String(i + 1).padStart(3, '0')}`,
      motor_no: m.motor_no || null,
      current_location_name: m.current_location_name || 'PELAGOS STORE',
      status: 'deployed',
      calibration_cert_no: cal.cert,
      calibration_expiry_date: cal.expiry,
      paired_set_code: `SET-GRT-${String(i + 1).padStart(2, '0')}`,
      is_active: true,
    });
  });

  // 4. Auxiliary Light Tools
  const auxiliaryTypes = [
    { type: 'stapler_gun', count: 20, name: 'Stapler Gun' },
    { type: 'release_barrel', count: 5, name: 'Release Barrel' },
    { type: 'coring', count: 3, name: 'Coring Machine' },
    { type: 'pneumatic_gun', count: 3, name: 'Pneumatic Gun Machine' },
    { type: 'cutter', count: 3, name: 'Husqvarna Concrete Cutting Machine' },
    { type: 'drill', count: 2, name: 'Drill Machine' },
  ];

  auxiliaryTypes.forEach(aux => {
    for (let c = 1; c <= aux.count; c++) {
      machineRows.push({
        machine_type: aux.type,
        brand: 'STANDARD',
        machine_no: `${aux.type.toUpperCase()}-${String(c).padStart(3, '0')}`,
        current_location_name: 'ABDUL AZIZ STORE',
        status: 'available',
        is_active: true,
      });
    }
  });

  const insertedMachines = await knex('equipment_machines').insert(machineRows).returning(['id', 'machine_no', 'current_location_name']);
  console.log(`✅ Seeded ${insertedMachines.length} machinery and equipment units into equipment_machines with calibration certs`);

  // Seed daily location logs for Feb 1 to Feb 21, 2026
  const dates = [];
  for (let d = 1; d <= 21; d++) {
    dates.push(`2026-02-${String(d).padStart(2, '0')}`);
  }

  const logRows = [];
  insertedMachines.forEach(m => {
    dates.forEach(d => {
      logRows.push({
        machine_id: m.id,
        log_date: d,
        location_name: m.current_location_name || 'ABDUL AZIZ STORE',
      });
    });
  });

  // Chunk insert
  const chunkSize = 500;
  for (let i = 0; i < logRows.length; i += chunkSize) {
    await knex('equipment_daily_logs').insert(logRows.slice(i, i + chunkSize));
  }

  console.log(`✅ Seeded ${logRows.length} daily tracking log entries (Feb 1–21, 2026)`);
};
