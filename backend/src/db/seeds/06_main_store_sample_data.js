const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {

  // ── 1. STORE CATEGORIES ──────────────────────────────────────────
  const catExists = await knex('store_categories').count('* as c').first();
  if (parseInt(catExists.c, 10) === 0) {
    await knex('store_categories').insert([
      { name: 'Steel & Metal',         short_name: 'STL',  status: 'Active' },
      { name: 'Cement & Concrete',     short_name: 'CEM',  status: 'Active' },
      { name: 'Electrical',            short_name: 'ELE',  status: 'Active' },
      { name: 'Plumbing & Pipes',      short_name: 'PLB',  status: 'Active' },
      { name: 'Tiles & Flooring',      short_name: 'TFL',  status: 'Active' },
      { name: 'Paint & Coating',       short_name: 'PNT',  status: 'Active' },
      { name: 'Hardware & Fasteners',  short_name: 'HRD',  status: 'Active' },
      { name: 'Welding Materials',     short_name: 'WLD',  status: 'Active' },
      { name: 'Safety Equipment',      short_name: 'SAF',  status: 'Active' },
      { name: 'Tools & Consumables',   short_name: 'TLC',  status: 'Inactive' },
    ]);
    console.log('✅ Seeded store_categories (10 rows)');
  }

  // ── 2. STORE BRANDS ──────────────────────────────────────────────
  const brandExists = await knex('store_brands').count('* as c').first();
  if (parseInt(brandExists.c, 10) === 0) {
    await knex('store_brands').insert([
      { name: 'Anchor',       short_name: 'ANC',  status: 'Active' },
      { name: 'Havells',      short_name: 'HVL',  status: 'Active' },
      { name: 'Birla',        short_name: 'BRL',  status: 'Active' },
      { name: 'UltraTech',    short_name: 'UTC',  status: 'Active' },
      { name: 'Jindal',       short_name: 'JDL',  status: 'Active' },
      { name: 'Finolex',      short_name: 'FNX',  status: 'Active' },
      { name: 'Polycab',      short_name: 'PCB',  status: 'Active' },
      { name: 'Berger',       short_name: 'BGR',  status: 'Active' },
      { name: 'Asian Paints', short_name: 'ASP',  status: 'Active' },
      { name: 'Stanley',      short_name: 'STN',  status: 'Inactive' },
    ]);
    console.log('✅ Seeded store_brands (10 rows)');
  }

  // ── 3. STORE MATERIALS ───────────────────────────────────────────
  const matExists = await knex('store_materials').count('* as c').first();
  if (parseInt(matExists.c, 10) === 0) {
    // Get IDs
    const cats = await knex('store_categories').select('id', 'short_name');
    const brands = await knex('store_brands').select('id', 'short_name');
    const catMap = {};  cats.forEach(c  => { catMap[c.short_name]  = c.id; });
    const brdMap = {};  brands.forEach(b => { brdMap[b.short_name] = b.id; });

    await knex('store_materials').insert([
      { name: 'TMT Steel Bar 12mm',        category_id: catMap['STL'], brand_id: brdMap['JDL'], quantity: 500,  unit: 'kg',   min_quantity: 50,  status: 'Active' },
      { name: 'TMT Steel Bar 16mm',        category_id: catMap['STL'], brand_id: brdMap['JDL'], quantity: 350,  unit: 'kg',   min_quantity: 50,  status: 'Active' },
      { name: 'OPC Cement 53 Grade',       category_id: catMap['CEM'], brand_id: brdMap['UTC'], quantity: 200,  unit: 'bags', min_quantity: 20,  status: 'Active' },
      { name: 'PPC Cement',                category_id: catMap['CEM'], brand_id: brdMap['BRL'], quantity: 150,  unit: 'bags', min_quantity: 15,  status: 'Active' },
      { name: 'PVC Conduit Pipe 25mm',     category_id: catMap['ELE'], brand_id: brdMap['ANC'], quantity: 100,  unit: 'pcs',  min_quantity: 10,  status: 'Active' },
      { name: 'Copper Wire 2.5sqmm',       category_id: catMap['ELE'], brand_id: brdMap['HVL'], quantity: 500,  unit: 'mtrs', min_quantity: 100, status: 'Active' },
      { name: 'GI Pipe 1 inch',            category_id: catMap['PLB'], brand_id: brdMap['FNX'], quantity: 80,   unit: 'pcs',  min_quantity: 10,  status: 'Active' },
      { name: 'CPVC Pipe 20mm',            category_id: catMap['PLB'], brand_id: brdMap['FNX'], quantity: 60,   unit: 'pcs',  min_quantity: 5,   status: 'Active' },
      { name: 'Vitrified Tile 600x600',    category_id: catMap['TFL'], brand_id: brdMap['ANC'], quantity: 300,  unit: 'sqft', min_quantity: 50,  status: 'Active' },
      { name: 'Exterior Emulsion Paint',   category_id: catMap['PNT'], brand_id: brdMap['BGR'], quantity: 40,   unit: 'ltrs', min_quantity: 5,   status: 'Active' },
    ]);
    console.log('✅ Seeded store_materials (10 rows)');
  }

  // ── 4. STORE PURCHASE ORDERS ─────────────────────────────────────
  const poExists = await knex('store_purchase_orders').count('* as c').first();
  if (parseInt(poExists.c, 10) === 0) {
    const poRows = await knex('store_purchase_orders').insert([
      { po_number: 'PO-2024-001', supplier_name: 'Al Habtoor Steel Traders',    po_date: '2024-01-10', status: 'Completed' },
      { po_number: 'PO-2024-002', supplier_name: 'Dubai Cement Suppliers LLC',  po_date: '2024-01-18', status: 'Completed' },
      { po_number: 'PO-2024-003', supplier_name: 'Emirates Electrical Dist.',   po_date: '2024-02-05', status: 'Pending'   },
      { po_number: 'PO-2024-004', supplier_name: 'Gulf Pipe Industries',        po_date: '2024-02-14', status: 'Pending'   },
      { po_number: 'PO-2024-005', supplier_name: 'Nasser Tiles & Ceramics',    po_date: '2024-02-20', status: 'Completed' },
      { po_number: 'PO-2024-006', supplier_name: 'Berger Paints UAE',          po_date: '2024-03-01', status: 'Pending'   },
      { po_number: 'PO-2024-007', supplier_name: 'Stanley Hardware Supplies',  po_date: '2024-03-10', status: 'Cancelled' },
      { po_number: 'PO-2024-008', supplier_name: 'Al Habtoor Steel Traders',   po_date: '2024-03-22', status: 'Pending'   },
      { po_number: 'PO-2024-009', supplier_name: 'Dubai Cement Suppliers LLC', po_date: '2024-04-05', status: 'Completed' },
      { po_number: 'PO-2024-010', supplier_name: 'Emirates Electrical Dist.',  po_date: '2024-04-15', status: 'Pending'   },
    ]).returning('id');

    // Seed PO items for first 3 POs
    const materials = await knex('store_materials').select('id').limit(6);
    if (poRows.length > 0 && materials.length > 0) {
      const poItems = [];
      poRows.slice(0, 3).forEach((po, pi) => {
        const poId = typeof po === 'object' ? po.id : po;
        poItems.push({ po_id: poId, material_id: materials[pi * 2]?.id, quantity: 50 });
        if (materials[pi * 2 + 1]) {
          poItems.push({ po_id: poId, material_id: materials[pi * 2 + 1]?.id, quantity: 30 });
        }
      });
      await knex('store_po_items').insert(poItems);
    }
    console.log('✅ Seeded store_purchase_orders (10 rows) + po_items');
  }

  // ── 5. PURCHASE RETURNS ──────────────────────────────────────────
  const retExists = await knex('store_purchase_returns').count('* as c').first();
  if (parseInt(retExists.c, 10) === 0) {
    const retRows = await knex('store_purchase_returns').insert([
      { return_number: 'RTN-2024-001', return_date: '2024-01-25', reason: 'Damaged on delivery',       status: 'Approved' },
      { return_number: 'RTN-2024-002', return_date: '2024-02-08', reason: 'Wrong specification',       status: 'Pending'  },
      { return_number: 'RTN-2024-003', return_date: '2024-02-18', reason: 'Excess quantity received',  status: 'Approved' },
      { return_number: 'RTN-2024-004', return_date: '2024-03-02', reason: 'Quality not meeting spec',  status: 'Rejected' },
      { return_number: 'RTN-2024-005', return_date: '2024-03-14', reason: 'Supplier recall notice',    status: 'Pending'  },
      { return_number: 'RTN-2024-006', return_date: '2024-03-28', reason: 'Wrong color/type supplied', status: 'Approved' },
      { return_number: 'RTN-2024-007', return_date: '2024-04-03', reason: 'Expired materials',         status: 'Pending'  },
      { return_number: 'RTN-2024-008', return_date: '2024-04-10', reason: 'Duplicate order',           status: 'Rejected' },
      { return_number: 'RTN-2024-009', return_date: '2024-04-20', reason: 'Packaging damage',          status: 'Approved' },
      { return_number: 'RTN-2024-010', return_date: '2024-05-01', reason: 'Project scope change',      status: 'Pending'  },
    ]).returning('id');

    const materials = await knex('store_materials').select('id').limit(5);
    if (retRows.length > 0 && materials.length > 0) {
      const retItems = [];
      retRows.slice(0, 5).forEach((ret, ri) => {
        const retId = typeof ret === 'object' ? ret.id : ret;
        retItems.push({ return_id: retId, material_id: materials[ri % materials.length]?.id, quantity: 10 });
      });
      await knex('store_return_items').insert(retItems);
    }
    console.log('✅ Seeded store_purchase_returns (10 rows) + return_items');
  }

  console.log('🎉 All Main Store seed data inserted successfully!');
};
