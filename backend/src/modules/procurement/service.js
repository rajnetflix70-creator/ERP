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
      'po.vendor_id', 'v.vendor_name', 'v.name as v_name',
      'po.delivery_site_id', 's.name as site_name',
      'u.full_name as raised_by_name', 'po.created_at'
    )
    .orderBy('po.created_at', 'desc');

  return pos.map(p => ({
    ...p,
    vendor_name: p.vendor_name || p.v_name || 'Vendor',
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
  await db('purchase_orders').where({ id: poId }).orWhere({ po_number: poId }).update(updateData);
  return { success: true };
}

async function createGRN(data, userId) {
  if (!data.po_id) {
    const err = new Error('Purchase Order ID is required for GRN');
    err.statusCode = 400;
    throw err;
  }
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    const err = new Error('At least one item is required for GRN');
    err.statusCode = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    const grns = data.items.map(i => ({
      po_id: data.po_id,
      po_line_item_id: i.po_line_item_id || null,
      received_by: userId,
      received_date: data.received_date || new Date().toISOString().slice(0, 10),
      qty_received: parseFloat(i.qty_received) || 0,
      remarks: i.remarks || null
    }));

    await trx('grn_records').insert(grns);
    
    // Auto update PO status to delivered if appropriate (simplified logic)
    await trx('purchase_orders').where({ id: data.po_id }).update({ status: 'delivered', updated_at: db.fn.now() });

    return { success: true };
  });
}

module.exports = {
  getPRs, createPR, approvePR,
  getPOs, createPO, updatePOStatus,
  createGRN
};
