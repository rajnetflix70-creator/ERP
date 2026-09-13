import React, { useState, useEffect } from 'react';
import client from '../api/client';

const VendorsMaster = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'General Supplies',
    contact_person: '',
    phone: '',
    email: '',
    gstin: '',
    status: 'Active'
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await client.get('/vendors?limit=200');
      const raw = res.data?.data?.vendors || res.data?.vendors || res.data?.data || res.data || [];

      let mapped = [];
      if (Array.isArray(raw)) {
        mapped = raw.map(v => ({
          id: v.id,
          code: v.code || v.vendor_code || `VEN-${String(v.id).slice(0, 6)}`,
          name: v.name || v.vendor_name,
          category: v.category || v.vendor_type || 'General Supplies',
          contact_person: v.contact_person || v.contact_name || '-',
          phone: v.phone || v.mobile || '-',
          email: v.email || '-',
          gstin: v.gstin || v.trn_number || v.tax_number || '-',
          rating: v.rating || 5.0,
          status: v.status ? (v.status.toLowerCase() === 'active' ? 'Active' : 'Inactive') : (v.is_active !== false ? 'Active' : 'Inactive'),
          total_purchase: v.total_purchase ? `AED ${v.total_purchase}` : 'AED 0',
          open_pos: v.open_pos_count || 0
        }));
      }

      setVendors(mapped);
    } catch (err) {
      console.warn('Error fetching vendors from backend:', err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const categories = ['All', ...new Set(vendors.map(v => v.category).filter(Boolean))];

  const filtered = vendors.filter(v => {
    const matchSearch = (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (v.code || '').toLowerCase().includes(search.toLowerCase()) ||
                        (v.contact_person || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || v.category === selectedCat;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({
      code: `VEN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'General Supplies',
      contact_person: '',
      phone: '',
      email: '',
      gstin: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVendor(v);
    setFormData({
      code: v.code || '',
      name: v.name || '',
      category: v.category || 'General Supplies',
      contact_person: v.contact_person || '',
      phone: v.phone || '',
      email: v.email || '',
      gstin: v.gstin || '',
      status: v.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter a Vendor / Company Name');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      vendor_name: formData.name.trim(),
      code: formData.code,
      vendor_code: formData.code,
      category: formData.category,
      vendor_type: formData.category,
      contact_person: formData.contact_person,
      phone: formData.phone,
      mobile: formData.phone,
      email: formData.email,
      gstin: formData.gstin,
      trn_number: formData.gstin,
      status: formData.status
    };

    try {
      if (editingVendor) {
        await client.put(`/vendors/${editingVendor.id}`, payload);
      } else {
        await client.post('/vendors', payload);
      }
      await fetchVendors();
      setModalOpen(false);
    } catch (apiErr) {
      console.error('Save vendor API error:', apiErr);
      alert('Failed to save vendor to database. Please check your backend connection.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate/delete this vendor?')) {
      try {
        await client.delete(`/vendors/${id}`);
      } catch (e) {
        console.warn('Delete vendor error:', e);
      }
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Approved supplier directory, procurement track record & rating</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Add Vendor
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search vendors by name, code or contact person..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="form-control"
              style={{ paddingLeft: '32px' }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Category:</span>
            <select
              value={selectedCat}
              onChange={e => { setSelectedCat(e.target.value); setPage(1); }}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Vendor Table (Screen 10 in Reference) */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Vendor Code</th>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>Contact Person</th>
                <th>Phone / Mobile</th>
                <th>GSTIN</th>
                <th>Total Purchase</th>
                <th>Open POs</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No vendors found.
                  </td>
                </tr>
              ) : (
                paginated.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{v.code}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text)' }}>
                      <div>{v.name}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.email}</span>
                    </td>
                    <td><span className="badge badge-info">{v.category}</span></td>
                    <td style={{ fontWeight: '500' }}>{v.contact_person}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.phone}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{v.gstin}</td>
                    <td style={{ fontWeight: '600' }}>{v.total_purchase}</td>
                    <td>
                      <span className={`badge ${v.open_pos > 0 ? 'badge-warning' : 'badge-default'}`}>
                        {v.open_pos} POs
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${v.status === 'Active' ? 'badge-success' : 'badge-default'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="btn btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--danger-lt)', color: 'var(--danger)', border: '1px solid #fecaca' }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <b>{filtered.length === 0 ? 0 : (page - 1) * perPage + 1}</b> to <b>{Math.min(page * perPage, filtered.length)}</b> of <b>{filtered.length}</b> vendors
          </span>
          <div className="pagination">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="pagination-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">🏢</div>
                <div>
                  <h3 className="modal-title">{editingVendor ? 'Edit Vendor Profile' : 'Add New Vendor'}</h3>
                  <p className="modal-subtitle">Supplier registration, commercial terms and GST compliance</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Vendor Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendor / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABC Traders Pvt Ltd"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Primary Category *</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="form-control"
                    >
                      {['Cement & Aggregate', 'Steel & Rebar', 'Electrical & Plumbing', 'Plumbing & Drainage', 'Paints & Finishes', 'Sand & M-Sand', 'Flooring & Tiles', 'Masonry & Bricks'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Mobile / Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98400 12345"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="sales@vendor.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">GSTIN Number</label>
                    <input
                      type="text"
                      placeholder="33AABCA1234F1Z5"
                      value={formData.gstin}
                      onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="form-control"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="form-control"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsMaster;
