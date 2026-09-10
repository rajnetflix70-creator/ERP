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

async function getPOs() {
  return db('purchase_orders as po')
    .leftJoin('vendors as v', 'po.vendor_id', 'v.id')
    .leftJoin('users as u', 'po.raised_by', 'u.id')
    .select(
      'po.id', 'po.po_number', 'po.status', 'po.po_date', 'po.total_amount',
      'v.vendor_name', 'u.full_name as raised_by_name', 'po.created_at'
    )
    .orderBy('po.created_at', 'desc');
}

async function createPO(data, userId) {
  if (!data.vendor_id) {
    const err = new Error('Vendor is required for purchase order');
    err.statusCode = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    const po_number = `PO-${Date.now()}`;
    let total_amount = 0;
    
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach(i => {
        total_amount += (parseFloat(i.qty_ordered) || 0) * (parseFloat(i.unit_price) || 0);
      });
    }

    const [poId] = await trx('purchase_orders').insert({
      po_number,
      vendor_id: data.vendor_id,
      pr_id: data.pr_id || null,
      raised_by: userId,
      status: 'draft',
      po_date: data.po_date || new Date().toISOString().slice(0, 10),
      total_amount,
      delivery_site_id: data.delivery_site_id || null
    }).returning('id');

    const poIdVal = typeof poId === 'object' ? poId.id : poId;

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const items = data.items.map(i => {
        const qty = parseFloat(i.qty_ordered) || 0;
        const price = parseFloat(i.unit_price) || 0;
        return {
          po_id: poIdVal,
          material_id: i.material_id,
          qty_ordered: qty,
          unit_price: price,
          total: qty * price
        };
      });
      await trx('po_line_items').insert(items);
    }

    if (data.pr_id) {
      await trx('purchase_requests').where({ id: data.pr_id }).update({ status: 'po_raised' });
    }

    return { id: poIdVal, po_number };
  });
}

async function updatePOStatus(poId, status, userId) {
  const updateData = { status, updated_at: db.fn.now() };
  if (status === 'approved') updateData.approved_by = userId;
  await db('purchase_orders').where({ id: poId }).update(updateData);
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
