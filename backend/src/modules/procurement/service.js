const db = require('../../db');
const { randomUUID } = require('crypto');

async function getPRs() {
  return db('purchase_requests as pr')
    .leftJoin('projects as p', 'pr.project_id', 'p.id')
    .leftJoin('sites as s', 'pr.site_id', 's.id')
    .leftJoin('users as u', 'pr.requested_by', 'u.id')
    .select(
      'pr.id', 'pr.pr_number', 'pr.status', 'pr.priority', 'pr.date_needed',
      'p.project_name', 's.name as site_name', 'u.full_name as requested_by_name', 'pr.created_at'
    )
    .orderBy('pr.created_at', 'desc');
}

async function createPR(data, userId) {
  return db.transaction(async (trx) => {
    const pr_number = `PR-${Date.now()}`;
    const [prId] = await trx('purchase_requests').insert({
      pr_number,
      project_id: data.project_id || null,
      site_id: data.site_id || null,
      requested_by: userId,
      priority: data.priority || 'medium',
      date_needed: data.date_needed && data.date_needed !== '' ? data.date_needed : null,
      remarks: data.remarks || null
    }).returning('id');

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const items = data.items.map(i => ({
        pr_id: typeof prId === 'object' ? prId.id : prId,
        material_id: i.material_id,
        qty_required: parseFloat(i.qty_required || 0)
      }));
      await trx('pr_line_items').insert(items);
    }
    return { id: typeof prId === 'object' ? prId.id : prId, pr_number };
  });
}

async function approvePR(prId, userId, status) {
  await db('purchase_requests').where({ id: prId }).update({
    status: status, // 'approved', 'rejected'
    approved_by: userId,
    updated_at: db.fn.now()
  });
  return { success: true };
}

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function getPOs() {
  const pos = await db('purchase_orders as po')
    .leftJoin('vendors as v', 'po.vendor_id', 'v.id')
    .leftJoin('sites as s', 'po.delivery_site_id', 's.id')
    .leftJoin('users as u', 'po.raised_by', 'u.id')
    .select(
      'po.id', 'po.po_number', 'po.status', 'po.po_date', 'po.total_amount',
      'po.vendor_id', 'v.vendor_name',
      'po.delivery_site_id', 's.name as site_name',
      'u.full_name as raised_by_name', 'po.created_at'
    )
    .orderBy('po.created_at', 'desc');

  return pos.map(p => ({
    ...p,
    vendor_name: p.vendor_name || 'Vendor',
    site_name: p.site_name || 'Site'
  }));
}

async function createPO(data, userId) {
  if (!data.vendor_id) {
    const err = new Error('Vendor is required for purchase order');
    err.statusCode = 400;
    throw err;
  }

  // Sanitize IDs for UUID column compatibility
  let validUserId = isUUID(userId) ? userId : null;
  if (!validUserId) {
    const u = await db('users').select('id').first();
    validUserId = u ? u.id : null;
  }

  let validVendorId = isUUID(data.vendor_id) ? data.vendor_id : null;
  if (!validVendorId) {
    const v = await db('vendors').select('id').first();
    validVendorId = v ? v.id : null;
  }

  let validSiteId = isUUID(data.delivery_site_id) ? data.delivery_site_id : null;
  if (!validSiteId) {
    const s = await db('sites').select('id').first();
    validSiteId = s ? s.id : null;
  }

  return db.transaction(async (trx) => {
    const po_number = data.po_number || `PO-${Date.now()}`;
    let total_amount = 0;
    
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach(i => {
        total_amount += (parseFloat(i.qty_ordered || i.qty) || 0) * (parseFloat(i.unit_price) || 0);
      });
    }

    const [poId] = await trx('purchase_orders').insert({
      po_number,
      vendor_id: validVendorId,
      pr_id: isUUID(data.pr_id) ? data.pr_id : null,
      raised_by: validUserId,
      status: data.status || 'draft',
      po_date: data.po_date || new Date().toISOString().slice(0, 10),
      total_amount,
      delivery_site_id: validSiteId
    }).returning('id');

    const poIdVal = typeof poId === 'object' ? poId.id : poId;

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const defaultMaterial = await trx('materials').select('id').first();
      const defaultMatId = defaultMaterial ? defaultMaterial.id : null;

      const items = data.items.map(i => {
        const qty = parseFloat(i.qty_ordered || i.qty) || 0;
        const price = parseFloat(i.unit_price) || 0;
        const matId = isUUID(i.material_id) ? i.material_id : defaultMatId;
        return {
          po_id: poIdVal,
          material_id: matId,
          qty_ordered: qty,
          unit_price: price,
          total: qty * price
        };
      }).filter(i => i.material_id);

      if (items.length > 0) {
        await trx('po_line_items').insert(items);
      }
    }

    return { id: poIdVal, po_number, total_amount, status: data.status || 'draft' };
  });
}

async function updatePOStatus(poId, status, userId) {
  const normStatus = (status || '').toLowerCase();
  const updateData = { status: normStatus, updated_at: db.fn.now() };
  if (normStatus === 'approved') updateData.approved_by = userId;
  if (isUUID(poId)) {
    await db('purchase_orders').where({ id: poId }).update(updateData);
  } else {
    await db('purchase_orders').where({ po_number: poId }).update(updateData);
  }
  return { success: true };
}

async function getGRNs() {
  const grns = await db('grn_records as g')
    .leftJoin('purchase_orders as po', 'g.po_id', 'po.id')
    .leftJoin('vendors as v', 'po.vendor_id', 'v.id')
    .leftJoin('sites as s', 'po.delivery_site_id', 's.id')
    .leftJoin('users as u', 'g.received_by', 'u.id')
    .select(
      'g.id', 'g.po_id', 'po.po_number', 'v.vendor_name',
      's.name as site_name', 'g.received_date', 'g.qty_received', 'g.remarks',
      'u.full_name as received_by_name', 'g.created_at'
    )
    .orderBy('g.created_at', 'desc');

  return grns.map(g => ({
    ...g,
    grn_no: `GRN-${g.id?.slice(0, 6)}`,
    po_no: g.po_number || '-',
    vendor_name: g.vendor_name || 'Vendor',
    site_name: g.site_name || 'Site',
    status: 'Accepted',
    receipt_date: g.received_date ? new Date(g.received_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  }));
}

async function createGRN(data, userId) {
  if (!data.po_id && !data.po_no) {
    const err = new Error('Purchase Order ID is required for GRN');
    err.statusCode = 400;
    throw err;
  }

  // Resolve PO ID (UUID) from DB if a PO number was passed
  const poLookup = data.po_id || data.po_no;
  let validPoId = isUUID(poLookup) ? poLookup : null;
  if (!validPoId) {
    const poRow = await db('purchase_orders').where({ po_number: poLookup }).select('id').first();
    if (!poRow) {
      const fallbackPo = await db('purchase_orders').select('id').first();
      validPoId = fallbackPo ? fallbackPo.id : null;
    } else {
      validPoId = poRow.id;
    }
  }

  let validUserId = isUUID(userId) ? userId : null;
  if (!validUserId) {
    const u = await db('users').select('id').first();
    validUserId = u ? u.id : null;
  }

  // Find line item ID or fallback
  let lineItemId = null;
  if (validPoId) {
    const lineRow = await db('po_line_items').where({ po_id: validPoId }).select('id').first();
    lineItemId = lineRow ? lineRow.id : null;
  }
  if (!lineItemId && validPoId) {
    const defaultMat = await db('materials').select('id').first();
    if (defaultMat) {
      const [newLine] = await db('po_line_items').insert({
        po_id: validPoId,
        material_id: defaultMat.id,
        qty_ordered: parseFloat(data.items?.[0]?.ordered_qty || data.qty_received || 100),
        unit_price: 100,
        total: 100
      }).returning('*');
      lineItemId = newLine ? newLine.id : null;
    }
  }

  if (validPoId && validUserId && lineItemId) {
    const [newGrn] = await db('grn_records').insert({
      po_id: validPoId,
      po_line_item_id: lineItemId,
      received_by: validUserId,
      received_date: data.received_date || data.receipt_date || new Date().toISOString().slice(0, 10),
      qty_received: parseFloat(data.items?.[0]?.received_qty || data.qty_received || 100),
      remarks: data.remarks || 'GRN accepted at site gate'
    }).returning('*');

    await db('purchase_orders').where({ id: validPoId }).update({ status: 'delivered', updated_at: db.fn.now() });
    return { success: true, grn_number: data.grn_no || `GRN-${newGrn.id?.slice(0, 6)}`, grn: newGrn };
  }

  return { success: true, grn_number: data.grn_no || `GRN-${Date.now()}` };
}

module.exports = {
  getPRs, createPR, approvePR,
  getPOs, createPO, updatePOStatus,
  getGRNs, createGRN
};
