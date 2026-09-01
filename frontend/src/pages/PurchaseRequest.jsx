import React, { useState, useEffect } from 'react';
import { getPRs, createPR, approvePR } from '../api/procurement';
import apiClient from '../api/client';
import Modal from '../components/Modal';import { useAuth } from '../contexts/AuthContext';

const PurchaseRequest = () => {
  const { user } = useAuth();
  const [prs, setPRs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form states
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [formData, setFormData] = useState({
    project_id: '',
    site_id: '',
    priority: 'medium',
    date_needed: '',
    remarks: '',
    items: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prData, pData, sData, mData] = await Promise.all([
        getPRs(),
        apiClient.get('/projects').then(r => r.data),
        apiClient.get('/sites').then(r => r.data),
        apiClient.get('/materials').then(r => r.data)
      ]);
      setPRs(prData);
      setProjects(pData);
      setSites(sData);
      setMaterials(mData);
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
    setFormData({ ...formData, items: [...formData.items, { material_id: '', qty_required: 1 }] });
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
      await createPR(formData);
      setShowModal(false);
      setFormData({ project_id: '', site_id: '', priority: 'medium', date_needed: '', remarks: '', items: [] });
      loadData();
      setAlert({ type: 'success', message: 'PR created successfully' });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error creating PR' });
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await approvePR(id, status);
      loadData();
      setAlert({ type: 'success', message: `PR status updated to ${status}` });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error updating PR status' });
    }
  };

  const isAdmin = ['super_admin', 'company_admin'].includes(user?.role);

  return (
    <div style={{ padding: '0 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">📋 Purchase Requests</h1>
          <p className="page-subtitle">Request materials for sites or projects.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Raise PR</button>
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
                  <th>PR Number</th>
                  <th>Project / Site</th>
                  <th>Requested By</th>
                  <th>Date Needed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prs.map(pr => (
                  <tr key={pr.id}>
                    <td style={{ fontWeight: 600 }}>{pr.pr_number}</td>
                    <td>{pr.project_name || 'N/A'} <br/> <small>{pr.site_name || 'N/A'}</small></td>
                    <td>{pr.requested_by_name}</td>
                    <td>{pr.date_needed.split('T')[0]}</td>
                    <td>
                      <span className={`badge ${pr.status === 'pending' ? 'badge-warning' : pr.status === 'approved' ? 'badge-success' : pr.status === 'po_raised' ? 'badge-primary' : 'badge-danger'}`}>
                        {pr.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {isAdmin && pr.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-sm btn-success" onClick={() => handleApprove(pr.id, 'approved')}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleApprove(pr.id, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {prs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No purchase requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Raise Purchase Request" icon="🛒" size="md">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Project</label>
              <select className="form-control" value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })}>
                <option value="">Select Project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Site</label>
              <select className="form-control" value={formData.site_id} onChange={e => setFormData({ ...formData, site_id: e.target.value })}>
                <option value="">Select Site...</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-control" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Date Needed</label>
              <input type="date" className="form-control" required value={formData.date_needed} onChange={e => setFormData({ ...formData, date_needed: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Remarks</label>
            <input type="text" className="form-control" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
          </div>

          <div style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>Materials</label>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItem}>+ Add Item</button>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <select required className="form-control" style={{ flex: 2 }} value={item.material_id} onChange={e => handleItemChange(idx, 'material_id', e.target.value)}>
                  <option value="">Select Material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit_of_measure})</option>)}
                </select>
                <input type="number" required min="0.1" step="0.1" className="form-control" style={{ flex: 1 }} placeholder="Qty" value={item.qty_required} onChange={e => handleItemChange(idx, 'qty_required', e.target.value)} />
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(idx)}>✕</button>
              </div>
            ))}
            {formData.items.length === 0 && <div style={{ fontSize: '0.85rem', color: '#666' }}>No items added yet.</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit PR</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseRequest;
