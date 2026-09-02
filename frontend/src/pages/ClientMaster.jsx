import React, { useState, useEffect } from 'react';
import { getClients, createClient, updateClient } from '../api/billing';
import Modal from '../components/Modal';

const ClientMaster = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
    trn_number: '',
    is_active: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(Array.isArray(data) ? data : (data?.clients || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditMode(true);
      setFormData(client);
    } else {
      setEditMode(false);
      setFormData({
        id: null, name: '', contact_person: '', mobile: '', email: '', address: '', trn_number: '', is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && formData.id) {
        await updateClient(formData.id, formData);
      } else {
        await createClient(formData);
      }
      setShowModal(false);
      loadData();
      setAlert({ type: 'success', message: editMode ? 'Client updated successfully' : 'Client created successfully' });
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Error saving client' });
    }
  };

  return (
    <div style={{ padding: '0 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">🏢 Client Master</h1>
          <p className="page-subtitle">Manage your clients for billing and invoicing.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Client</button>
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
                  <th>Client Name</th>
                  <th>Contact Person</th>
                  <th>Contact Info</th>
                  <th>TRN Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(clients) ? clients : []).map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.contact_person || '—'}</td>
                    <td>
                      <div>📞 {c.mobile || '—'}</div>
                      <div>✉️ {c.email || '—'}</div>
                    </td>
                    <td>{c.trn_number || '—'}</td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-present' : 'badge-danger'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleOpenModal(c)}>✏️ Edit</button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No clients found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? 'Edit Client' : 'Add Client'} icon="🏢" size="md">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Client / Company Name *</label>
            <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Contact Person</label>
              <input type="text" className="form-control" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Mobile Number</label>
              <input type="text" className="form-control" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="form-label">TRN Number</label>
              <input type="text" className="form-control" value={formData.trn_number} onChange={e => setFormData({ ...formData, trn_number: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Billing Address</label>
            <textarea className="form-control" rows="3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
              <span>Active Client</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Save'} Client</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientMaster;
