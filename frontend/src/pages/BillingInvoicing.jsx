import React, { useState, useEffect } from 'react';
import { getInvoices, createInvoice, updateInvoiceStatus, recordPayment, getClients } from '../api/billing';
import apiClient from '../api/client';
import Modal from '../components/Modal';
const BillingInvoicing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form states
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    period_from: '',
    period_to: '',
    items: []
  });

  const [paymentData, setPaymentData] = useState({
    amount_received: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'Bank Transfer',
    reference_no: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, cData, pData] = await Promise.all([
        getInvoices(),
        getClients(),
        apiClient.get('/projects').then(r => r.data)
      ]);
      setInvoices(invData);
      setClients(cData.filter(c => c.is_active));
      setProjects(pData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', qty: 1, unit_price: 0, vat_rate: 5 }] });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      setAlert({ type: 'error', message: 'Add at least one item' });
      return;
    }
    try {
      await createInvoice(formData);
      setShowModal(false);
      setFormData({ client_id: '', project_id: '', invoice_date: new Date().toISOString().slice(0, 10), period_from: '', period_to: '', items: [] });
      loadData();
      setAlert({ type: 'success', message: 'Invoice created successfully' });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error creating Invoice' });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateInvoiceStatus(id, status);
      loadData();
      setAlert({ type: 'success', message: `Invoice status updated to ${status}` });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error updating status' });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordPayment({ ...paymentData, invoice_id: selectedInvoice.id });
      setShowPaymentModal(false);
      loadData();
      setAlert({ type: 'success', message: 'Payment recorded successfully' });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error recording payment' });
    }
  };

  return (
    <div style={{ padding: '0 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">📄 Billing & Invoicing</h1>
          <p className="page-subtitle">Generate invoices, track payments, and manage cash flow.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Invoice</button>
      </div>

      {alert && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: alert.type === 'error' ? '#fef2f2' : '#f0fdf4', color: alert.type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
          {alert.message}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Date</th>
                  <th>Amount (AED)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td>{inv.client_name}</td>
                    <td>{inv.project_name || '—'}</td>
                    <td>{inv.invoice_date.split('T')[0]}</td>
                    <td style={{ fontWeight: 'bold' }}>{parseFloat(inv.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${inv.status === 'draft' ? 'badge-secondary' : inv.status === 'submitted' ? 'badge-primary' : inv.status === 'approved' ? 'badge-info' : 'badge-success'}`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {inv.status === 'draft' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(inv.id, 'submitted')}>Submit</button>
                      )}
                      {inv.status === 'submitted' && (
                        <button className="btn btn-sm btn-info" onClick={() => handleStatusChange(inv.id, 'approved')}>Approve</button>
                      )}
                      {inv.status === 'approved' && (
                        <button className="btn btn-sm btn-success" onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true); }}>Record Pay</button>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No invoices found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Invoice" icon="🧾" size="lg">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Client *</label>
              <select required className="form-control" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                <option value="">Select Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Project</label>
              <select className="form-control" value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })}>
                <option value="">-- No Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Invoice Date *</label>
              <input type="date" required className="form-control" value={formData.invoice_date} onChange={e => setFormData({ ...formData, invoice_date: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Period From</label>
              <input type="date" className="form-control" value={formData.period_from} onChange={e => setFormData({ ...formData, period_from: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Period To</label>
              <input type="date" className="form-control" value={formData.period_to} onChange={e => setFormData({ ...formData, period_to: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>Invoice Items *</label>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItem}>+ Add Item</button>
            </div>
            
            {formData.items.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr', gap: 10, marginBottom: 5, fontSize: '0.8rem', fontWeight: 'bold' }}>
                <div>Description</div>
                <div>Qty</div>
                <div>Unit Price</div>
                <div>VAT %</div>
                <div>Action</div>
              </div>
            )}

            {formData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <input type="text" required className="form-control" placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} />
                <input type="number" required min="0.1" step="0.1" className="form-control" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} />
                <input type="number" required min="0" step="0.01" className="form-control" placeholder="Price" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
                <input type="number" required min="0" max="100" className="form-control" placeholder="VAT" value={item.vat_rate} onChange={e => handleItemChange(idx, 'vat_rate', e.target.value)} />
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(idx)}>✕</button>
              </div>
            ))}
            
            {formData.items.length === 0 && <div style={{ fontSize: '0.85rem', color: '#666' }}>No items added yet.</div>}
          </div>
          
          <div className="modal-actions">
           <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
           <button type="submit" className="btn btn-primary">Create Invoice</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPaymentModal && !!selectedInvoice} onClose={() => setShowPaymentModal(false)} title="Record Payment" subtitle={selectedInvoice ? `Invoice: ${selectedInvoice.invoice_number}` : ''} icon="💰" size="sm">
        <form onSubmit={handlePaymentSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Amount Received (AED) *</label>
            <input type="number" required min="0.01" step="0.01" className="form-control" value={paymentData.amount_received} onChange={e => setPaymentData({ ...paymentData, amount_received: e.target.value })} />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Payment Date *</label>
            <input type="date" required className="form-control" value={paymentData.payment_date} onChange={e => setPaymentData({ ...paymentData, payment_date: e.target.value })} />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Payment Mode</label>
            <select className="form-control" value={paymentData.payment_mode} onChange={e => setPaymentData({ ...paymentData, payment_mode: e.target.value })}>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Cash</option>
            </select>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Reference No.</label>
            <input type="text" className="form-control" placeholder="Cheque No. / Transaction ID" value={paymentData.reference_no} onChange={e => setPaymentData({ ...paymentData, reference_no: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Save Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingInvoicing;
