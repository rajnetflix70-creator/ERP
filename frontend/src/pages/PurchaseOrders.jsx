import React, { useState, useEffect } from 'react';
import { getPOs, createPO, updatePOStatus, getPRs } from '../api/procurement';
import apiClient from '../api/client';
import Modal from '../components/Modal';import { useAuth } from '../contexts/AuthContext';

const PurchaseOrders = () => {
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form states
  const [vendors, setVendors] = useState([]);
  const [prs, setPRs] = useState([]);
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [formData, setFormData] = useState({
    vendor_id: '',
    pr_id: '',
    po_date: new Date().toISOString().slice(0, 10),
    delivery_site_id: '',
    items: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [poData, prData, vData, sData, mData] = await Promise.all([
        getPOs(),
        getPRs().then(r => (Array.isArray(r) ? r.filter(pr => pr?.status === 'approved') : [])).catch(() => []),
        apiClient.get('/vendors').then(r => (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
        apiClient.get('/sites').then(r => (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
        apiClient.get('/materials').then(r => (Array.isArray(r?.data) ? r.data : [])).catch(() => [])
      ]);
      setPOs(Array.isArray(poData) ? poData : []);
      setPRs(Array.isArray(prData) ? prData : []);
      setVendors(Array.isArray(vData) ? vData : []);
      setSites(Array.isArray(sData) ? sData : []);
      setMaterials(Array.isArray(mData) ? mData : []);
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
    setFormData({ ...formData, items: [...formData.items, { material_id: '', qty_ordered: 1, unit_price: 0 }] });
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
      await createPO(formData);
      setShowModal(false);
      setFormData({ vendor_id: '', pr_id: '', po_date: new Date().toISOString().slice(0, 10), delivery_site_id: '', items: [] });
      loadData();
      setAlert({ type: 'success', message: 'PO created successfully' });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error creating PO' });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updatePOStatus(id, status);
      loadData();
      setAlert({ type: 'success', message: `PO status updated to ${status}` });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error updating PO status' });
    }
  };

  return (
    <div style={{ padding: '0 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">🛒 Purchase Orders</h1>
          <p className="page-subtitle">Manage purchase orders and supplier procurement.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create PO</button>
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
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Amount (AED)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600 }}>{po.po_number}</td>
                    <td>{po.vendor_name}</td>
                    <td>{po.po_date.split('T')[0]}</td>
                    <td style={{ fontWeight: 'bold' }}>{parseFloat(po.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${po.status === 'draft' ? 'badge-secondary' : po.status === 'approved' ? 'badge-primary' : po.status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
                        {po.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {po.status === 'draft' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(po.id, 'approved')}>Approve</button>
                      )}
                      {po.status === 'approved' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(po.id, 'issued')}>Issue</button>
                      )}
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No purchase orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Order" icon="🛒" size="lg">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Vendor *</label>
              <select required className="form-control" value={formData.vendor_id} onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}>
                <option value="">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">From Approved PR (Optional)</label>
              <select className="form-control" value={formData.pr_id} onChange={e => setFormData({ ...formData, pr_id: e.target.value })}>
                <option value="">-- Direct PO --</option>
                {prs.map(p => <option key={p.id} value={p.id}>{p.pr_number} - {p.requested_by_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">PO Date *</label>
              <input type="date" required className="form-control" value={formData.po_date} onChange={e => setFormData({ ...formData, po_date: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Delivery Site</label>
              <select className="form-control" value={formData.delivery_site_id} onChange={e => setFormData({ ...formData, delivery_site_id: e.target.value })}>
                <option value="">Select Site...</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>Materials *</label>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItem}>+ Add Item</button>
            </div>
            
            {formData.items.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 10, marginBottom: 5, fontSize: '0.8rem', fontWeight: 'bold' }}>
                <div>Material</div>
                <div>Qty</div>
                <div>Unit Price</div>
                <div>Action</div>
              </div>
            )}

            {formData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <select required className="form-control" value={item.material_id} onChange={e => handleItemChange(idx, 'material_id', e.target.value)}>
                  <option value="">Select Material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit_of_measure})</option>)}
                </select>
                <input type="number" required min="0.1" step="0.1" className="form-control" placeholder="Qty" value={item.qty_ordered} onChange={e => handleItemChange(idx, 'qty_ordered', e.target.value)} />
                <input type="number" required min="0" step="0.01" className="form-control" placeholder="Price" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(idx)}>✕</button>
              </div>
            ))}
            
            {formData.items.length === 0 && <div style={{ fontSize: '0.85rem', color: '#666' }}>No items added yet.</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create PO</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
