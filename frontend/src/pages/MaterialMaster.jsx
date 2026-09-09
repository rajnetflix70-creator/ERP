import React, { useState } from 'react';

const INITIAL_MATERIALS = [
  { id: 1, code: 'MAT-001', name: 'OPC Cement 53 Grade', category: 'Cement', subcategory: 'Portland', unit: 'Bag', brand: 'UltraTech', spec: 'IS 12269:2013', gst: 28, min_stock: 200, current_rate: 380, status: 'Active' },
  { id: 2, code: 'MAT-002', name: 'TMT Steel 12mm Fe550D', category: 'Steel', subcategory: 'Reinforcement', unit: 'MT', brand: 'Tata Tiscon', spec: 'IS 1786:2008', gst: 18, min_stock: 10, current_rate: 64000, status: 'Active' },
  { id: 3, code: 'MAT-003', name: 'TMT Steel 16mm Fe550D', category: 'Steel', subcategory: 'Reinforcement', unit: 'MT', brand: 'JSW Neosteel', spec: 'IS 1786:2008', gst: 18, min_stock: 8, current_rate: 63500, status: 'Active' },
  { id: 4, code: 'MAT-004', name: 'Manufactured Sand (M-Sand)', category: 'Sand', subcategory: 'Fine Aggregate', unit: 'Ton', brand: 'RoboSilicon', spec: 'Zone II Graded', gst: 5, min_stock: 30, current_rate: 1100, status: 'Active' },
  { id: 5, code: 'MAT-005', name: 'Plastering Sand (P-Sand)', category: 'Sand', subcategory: 'Fine Aggregate', unit: 'Ton', brand: 'RoboSilicon', spec: 'Zone IV', gst: 5, min_stock: 20, current_rate: 1250, status: 'Active' },
  { id: 6, code: 'MAT-006', name: '20mm Blue Metal Aggregate', category: 'Aggregate', subcategory: 'Coarse', unit: 'Ton', brand: 'Local Quarry', spec: 'Crushed Granite', gst: 5, min_stock: 40, current_rate: 850, status: 'Active' },
  { id: 7, code: 'MAT-007', name: 'Wire Cut Red Clay Bricks', category: 'Masonry', subcategory: 'Bricks', unit: 'Nos', brand: 'Standard', spec: 'Class 7.5', gst: 12, min_stock: 5000, current_rate: 11, status: 'Active' },
  { id: 8, code: 'MAT-008', name: 'AAC Blocks 600x200x150mm', category: 'Masonry', subcategory: 'Blocks', unit: 'Nos', brand: 'Magicrete', spec: 'Grade 1 Autoclaved', gst: 18, min_stock: 800, current_rate: 72, status: 'Active' },
  { id: 9, code: 'MAT-009', name: 'Vitrified Floor Tiles 600x600', category: 'Flooring', subcategory: 'Tiles', unit: 'Sq.Ft', brand: 'Kajaria', spec: 'Double Charged GVT', gst: 18, min_stock: 1500, current_rate: 58, status: 'Active' },
  { id: 10, code: 'MAT-010', name: 'Exterior Emulsion Paint', category: 'Paint', subcategory: 'Exterior', unit: 'Litre', brand: 'Asian Paints', spec: 'Apex Ultima Protek', gst: 18, min_stock: 100, current_rate: 420, status: 'Active' },
  { id: 11, code: 'MAT-011', name: 'PVC Conduit Pipe 25mm', category: 'Electrical', subcategory: 'Conduits', unit: 'Mtr', brand: 'Finolex', spec: 'Heavy Gauge FRLS', gst: 18, min_stock: 500, current_rate: 45, status: 'Active' },
  { id: 12, code: 'MAT-012', name: 'CPVC Pipe 1 Inch SDR 11', category: 'Plumbing', subcategory: 'Pipes', unit: 'Mtr', brand: 'Astral', spec: 'ASTM D2846', gst: 18, min_stock: 250, current_rate: 115, status: 'Active' }
];

const MaterialMaster = () => {
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Cement',
    subcategory: '',
    unit: 'Bag',
    brand: '',
    spec: '',
    gst: 18,
    min_stock: 100,
    current_rate: '',
    status: 'Active'
  });

  const categories = ['All', ...new Set(materials.map(m => m.category))];

  const filtered = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `MAT-0${materials.length + 1}`.padStart(7, '0'),
      name: '',
      category: 'Cement',
      subcategory: '',
      unit: 'Bag',
      brand: '',
      spec: '',
      gst: 18,
      min_stock: 50,
      current_rate: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      setMaterials(materials.map(m => m.id === editingItem.id ? { ...formData, id: editingItem.id } : m));
    } else {
      setMaterials([{ ...formData, id: Date.now() }, ...materials]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this material from catalog?')) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Materials</h1>
          <p className="page-subtitle">Central material master directory & specifications catalog</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Add Material
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search materials by name or code..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="form-control"
                style={{ paddingLeft: '32px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Material Table (Screen 4 in Reference) */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Code</th>
                <th>Material Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Brand / Spec</th>
                <th>GST %</th>
                <th>Current Rate</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No materials found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginated.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{item.code}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text)' }}>
                      <div>{item.name}</div>
                      {item.subcategory && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.subcategory}</span>}
                    </td>
                    <td><span className="badge badge-info">{item.category}</span></td>
                    <td style={{ fontWeight: '600' }}>{item.unit}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.brand || '—'} {item.spec ? `(${item.spec})` : ''}
                    </td>
                    <td>{item.gst}%</td>
                    <td style={{ fontWeight: '600' }}>₹{Number(item.current_rate || 0).toLocaleString('en-IN')}</td>
                    <td>{item.min_stock} {item.unit}</td>
                    <td>
                      <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-default'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <b>{filtered.length === 0 ? 0 : (page - 1) * perPage + 1}</b> to <b>{Math.min(page * perPage, filtered.length)}</b> of <b>{filtered.length}</b> materials
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
                <div className="modal-icon">📦</div>
                <div>
                  <h3 className="modal-title">{editingItem ? 'Edit Material' : 'Add New Material'}</h3>
                  <p className="modal-subtitle">Configure master catalog specifications and default units</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Material Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Material Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OPC Cement 53 Grade"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="form-control"
                    >
                      {['Cement', 'Steel', 'Sand', 'Aggregate', 'Masonry', 'Flooring', 'Paint', 'Electrical', 'Plumbing', 'Chemicals'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subcategory</label>
                    <input
                      type="text"
                      placeholder="e.g. Portland"
                      value={formData.subcategory}
                      onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="form-control"
                    >
                      {['Bag', 'MT', 'Ton', 'Nos', 'Kg', 'Sq.Ft', 'Cu.M', 'Litre', 'Mtr', 'Bundle'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Preferred Brand / Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. UltraTech, Tata Steel"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Technical Specification / Grade</label>
                    <input
                      type="text"
                      placeholder="e.g. IS 12269, Fe550D"
                      value={formData.spec}
                      onChange={e => setFormData({ ...formData, spec: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">GST %</label>
                    <select
                      value={formData.gst}
                      onChange={e => setFormData({ ...formData, gst: Number(e.target.value) })}
                      className="form-control"
                    >
                      {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Rate (₹)</label>
                    <input
                      type="number"
                      placeholder="380"
                      value={formData.current_rate}
                      onChange={e => setFormData({ ...formData, current_rate: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Threshold</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={e => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                      className="form-control"
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
                  {editingItem ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialMaster;
