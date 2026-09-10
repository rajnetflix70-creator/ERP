const db = require('../../db');

function sanitizeClientData(data) {
  const allowed = ['name', 'contact_person', 'mobile', 'email', 'address', 'trn_number', 'is_active'];
  const sanitized = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

async function getClients() {
  return db('clients').orderBy('name', 'asc');
}

async function createClient(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Client name is required');
    err.statusCode = 400;
    throw err;
  }
  const sanitized = sanitizeClientData(data);
  const [client] = await db('clients').insert(sanitized).returning('*');
  return client;
}

async function updateClient(id, data) {
  const sanitized = sanitizeClientData(data);
  const [client] = await db('clients').where({ id }).update({ ...sanitized, updated_at: db.fn.now() }).returning('*');
  return client;
}

async function getInvoices() {
  return db('invoices as i')
    .leftJoin('clients as c', 'i.client_id', 'c.id')
    .leftJoin('projects as p', 'i.project_id', 'p.id')
    .select(
      'i.id', 'i.invoice_number', 'i.invoice_date', 'i.total_amount', 'i.status',
      'c.name as client_name', 'p.project_name'
    )
    .orderBy('i.created_at', 'desc');
}

async function getInvoiceById(id) {
  const invoice = await db('invoices as i')
    .leftJoin('clients as c', 'i.client_id', 'c.id')
    .leftJoin('projects as p', 'i.project_id', 'p.id')
    .select(
      'i.*', 'c.name as client_name', 'c.trn_number', 'c.address', 'c.contact_person',
      'p.project_name'
    )
    .where('i.id', id)
    .first();

  if (invoice) {
    invoice.items = await db('invoice_line_items').where({ invoice_id: id });
    invoice.payments = await db('payments_received').where({ invoice_id: id }).orderBy('payment_date', 'asc');
  }
  return invoice;
}

async function createInvoice(data) {
  return db.transaction(async (trx) => {
    const invoice_number = `INV-${Date.now()}`;
    let subtotal = 0;
    let vat_amount = 0;
    
    if (data.items && data.items.length > 0) {
      data.items.forEach(i => {
        const amt = parseFloat(i.qty) * parseFloat(i.unit_price);
        subtotal += amt;
        vat_amount += (amt * (parseFloat(i.vat_rate || 5) / 100));
      });
    }
    
    const total_amount = subtotal + vat_amount;

    const [invId] = await trx('invoices').insert({
      invoice_number,
      project_id: data.project_id || null,
      client_id: data.client_id,
      invoice_date: data.invoice_date,
      period_from: data.period_from || null,
      period_to: data.period_to || null,
      subtotal,
      vat_amount,
      total_amount,
      status: 'draft'
    }).returning('id');

    if (data.items && data.items.length > 0) {
      const items = data.items.map(i => {
        const amt = parseFloat(i.qty) * parseFloat(i.unit_price);
        return {
          invoice_id: invId.id,
          description: i.description,
          qty: i.qty,
          unit_price: i.unit_price,
          vat_rate: i.vat_rate || 5,
          amount: amt
        };
      });
      await trx('invoice_line_items').insert(items);
    }

    return { id: invId.id, invoice_number };
  });
}

async function updateInvoiceStatus(id, status) {
  await db('invoices').where({ id }).update({ status, updated_at: db.fn.now() });
  return { success: true };
}

async function recordPayment(data) {
  return db.transaction(async (trx) => {
    await trx('payments_received').insert({
      invoice_id: data.invoice_id,
      amount_received: data.amount_received,
      payment_date: data.payment_date,
      payment_mode: data.payment_mode,
      reference_no: data.reference_no
    });
    
    // Check if fully paid
    const invoice = await trx('invoices').where({ id: data.invoice_id }).first();
    const payments = await trx('payments_received').where({ invoice_id: data.invoice_id }).sum('amount_received as total_paid').first();
    
    const totalPaid = parseFloat(payments.total_paid || 0);
    const invoiceTotal = parseFloat(invoice.total_amount);
    
    if (totalPaid >= invoiceTotal - 0.01) { // Floating point leeway
      await trx('invoices').where({ id: data.invoice_id }).update({ status: 'paid', updated_at: db.fn.now() });
    }
    return { success: true };
  });
}

module.exports = {
  getClients, createClient, updateClient,
  getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus,
  recordPayment
};
