import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
const VendorsMaster = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    vendor_name: '',
    vendor_type: 'Equipment Rental',
    vendor_category: 'equipment',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
    equipment_service: '',
    trn_number: '',
    bank_name: '',
    bank_account: '',
    credit_days: 30,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vRes = await apiClient.get('/equipment-machines/vendors');
      setVendors(Array.isArray(vRes?.data) ? vRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vendor = null) => {
    if (vendor) {
      setEditMode(true);
      setFormData({
        id: vendor.id,
        vendor_name: vendor.vendor_name || '',
        vendor_type: vendor.vendor_type || 'Equipment Rental',
        vendor_category: vendor.vendor_category || 'equipment',
        contact_person: vendor.contact_person || '',
        mobile: vendor.mobile || '',
        email: vendor.email || '',
        address: vendor.address || '',
        equipment_service: vendor.equipment_service || '',
        trn_number: vendor.trn_number || '',
        bank_name: vendor.bank_name || '',
        bank_account: vendor.bank_account || '',
        credit_days: vendor.credit_days || 30,
        is_active: vendor.is_active !== false
      });
    } else {
      setEditMode(false);
      setFormData({
        id: null, vendor_name: '', vendor_type: 'Equipment Rental', vendor_category: 'equipment',
        contact_person: '', mobile: '', email: '', address: '', equipment_service: '',
        trn_number: '', bank_name: '', bank_account: '', credit_days: 30, is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor_name) return setAlert({ type: 'error', message: 'Vendor Name required.' });
    
    try {
      if (editMode && formData.id) {
        await apiClient.put(`/equipment-machines/vendors/${formData.id}`, formData);
        setAlert({ type: 'success', message: 'Vendor updated successfully!' });
      } else {
        await apiClient.post('/equipment-machines/vendors', formData);
        setAlert({ type: 'success', message: 'Vendor registered successfully!' });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || err.response?.data?.message || 'Failed to save vendor.' });
    }
  };

  const toggleActiveStatus = async (vendor) => {
    try {
      await apiClient.put(`/equipment-machines/vendors/${vendor.id}`, { is_active: !vendor.is_active });
      fetchData();
      setAlert({ type: 'success', message: 'Vendor status updated successfully' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Error updating status' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading vendor directory...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
            🏗️ Vendor Master Directory
          </h2>
          <p className="page-subtitle">Manage suppliers for materials, equipment, and services.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Vendor</button>
      </div>

      {alert && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: alert.type === 'error' ? '#fef2f2' : '#f0fdf4', color: alert.type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
          {alert.message}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600' }}>Vendor Info</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600' }}>Contact Person</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600' }}>Finance Info</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{v.vendor_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{v.vendor_type}</div>
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    <span className="badge badge-asset">{v.vendor_category}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500', color: '#334155' }}>{v.contact_person || '—'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>📞 {v.mobile || '—'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>✉️ {v.email || '—'}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                    <div><strong>TRN:</strong> {v.trn_number || '—'}</div>
                    <div><strong>Terms:</strong> {v.credit_days} days</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className={`badge ${v.is_active ? 'badge-present' : 'badge-danger'}`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button className="btn btn-sm btn-secondary" style={{ marginRight: 8 }} onClick={() => handleOpenModal(v)}>✏️ Edit</button>
                    <button className={`btn btn-sm ${v.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActiveStatus(v)}>
                      {v.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No vendors registered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? 'Edit Vendor' : 'Add New Vendor'} icon="🏗️" size="lg">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Vendor Name *</label>
              <input type="text" className="form-control" required value={formData.vendor_name} onChange={e => setFormData({ ...formData, vendor_name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Vendor Category</label>
              <select className="form-control" value={formData.vendor_category} onChange={e => setFormData({ ...formData, vendor_category: e.target.value })}>
                <option value="equipment">Equipment & Machinery</option>
                <option value="material">Building Materials</option>
                <option value="labour">Labour Supply</option>
                <option value="transport">Transportation</option>
                <option value="service">Services (Subcontractors)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Primary Service / Type</label>
              <input type="text" className="form-control" placeholder="e.g. Concrete Supplier, Excavator Rental" value={formData.vendor_type} onChange={e => setFormData({ ...formData, vendor_type: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Contact Person</label>
              <input type="text" className="form-control" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">Mobile Number</label>
              <input type="text" className="form-control" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label className="form-label">TRN / Tax Number</label>
              <input type="text" className="form-control" value={formData.trn_number} onChange={e => setFormData({ ...formData, trn_number: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Company Address</label>
              <input type="text" className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 25 }}>
            <div>
              <label className="form-label">Bank Name</label>
              <input type="text" className="form-control" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Bank Account / IBAN</label>
              <input type="text" className="form-control" value={formData.bank_account} onChange={e => setFormData({ ...formData, bank_account: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Credit Days</label>
              <input type="number" className="form-control" value={formData.credit_days} onChange={e => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editMode ? 'Update Vendor' : 'Register Vendor'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorsMaster;
