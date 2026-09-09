import React, { useState } from 'react';

const INITIAL_VENDORS = [
  { id: 1, code: 'VEN-001', name: 'ABC Traders', category: 'Cement & Aggregate', contact_person: 'Suresh Kumar', phone: '+91 98401 23456', email: 'sales@abctraders.com', gstin: '33AABCA1234F1Z5', rating: 4.8, status: 'Active', total_purchase: '₹48.5 L', open_pos: 2 },
  { id: 2, code: 'VEN-002', name: 'XYZ Steel Industries', category: 'Steel & Rebar', contact_person: 'Ramesh Sundaram', phone: '+91 98402 34567', email: 'orders@xyzsteel.in', gstin: '33AABCX5678F1Z8', rating: 4.9, status: 'Active', total_purchase: '₹1.2 Cr', open_pos: 3 },
  { id: 3, code: 'VEN-003', name: 'BuildMart Building Supplies', category: 'Electrical & Plumbing', contact_person: 'Priya Sharma', phone: '+91 98403 45678', email: 'priya@buildmart.co.in', gstin: '33AABCB9012F1Z2', rating: 4.6, status: 'Active', total_purchase: '₹28.4 L', open_pos: 1 },
  { id: 4, code: 'VEN-004', name: 'Global Supplies & Solutions', category: 'Plumbing & Drainage', contact_person: 'Amit Verma', phone: '+91 98404 56789', email: 'info@globalsupplies.com', gstin: '33AABCG3456F1Z4', rating: 4.5, status: 'Active', total_purchase: '₹19.2 L', open_pos: 1 },
  { id: 5, code: 'VEN-005', name: 'Sri Ram Traders', category: 'Paints & Finishes', contact_person: 'Rajesh Babu', phone: '+91 98405 67890', email: 'sriramtraders.mas@gmail.com', gstin: '33AABCS7890F1Z6', rating: 4.2, status: 'Inactive', total_purchase: '₹8.6 L', open_pos: 0 },
  { id: 6, code: 'VEN-006', name: 'South India Quarry Products', category: 'Sand & M-Sand', contact_person: 'M. Natarajan', phone: '+91 98406 78901', email: 'natarajan@siquarry.in', gstin: '33AABCN2345F1Z9', rating: 4.7, status: 'Active', total_purchase: '₹34.0 L', open_pos: 2 },
  { id: 7, code: 'VEN-007', name: 'Kajaria & Co Tiles Emporium', category: 'Flooring & Tiles', contact_person: 'V. Raman', phone: '+91 98407 89012', email: 'chennai@kajariaemporium.com', gstin: '33AABCK6789F1Z1', rating: 4.8, status: 'Active', total_purchase: '₹22.1 L', open_pos: 1 }
];

const VendorsMaster = () => {
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Cement & Aggregate',
    contact_person: '',
    phone: '',
    email: '',
    gstin: '',
    status: 'Active'
  });

  const categories = ['All', ...new Set(vendors.map(v => v.category))];

  const filtered = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                        v.code.toLowerCase().includes(search.toLowerCase()) ||
                        v.contact_person.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || v.category === selectedCat;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({
      code: `VEN-00${vendors.length + 1}`,
      name: '',
      category: 'Cement & Aggregate',
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
    setFormData({ ...v });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingVendor) {
      setVendors(vendors.map(v => v.id === editingVendor.id ? { ...formData, id: editingVendor.id } : v));
    } else {
      setVendors([{ ...formData, id: Date.now(), total_purchase: '₹0 L', open_pos: 0, rating: 5.0 }, ...vendors]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to deactivate/delete this vendor?')) {
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
