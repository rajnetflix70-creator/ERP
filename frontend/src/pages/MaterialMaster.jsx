import React, { useState, useEffect, useCallback } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materials';
import Modal from '../components/Modal';

const CATEGORIES = ['Cement', 'Steel', 'Cables', 'Grouting', 'Chemical', 'Hardware', 'Timber', 'PVC', 'Other'];
const UNITS = ['bags', 'kg', 'ton', 'm', 'sqft', 'litre', 'nos', 'rolls', 'sheets', 'boxes', 'sets'];

const CAT_ICONS = {
  Cement: '🏗️', Steel: '⚙️', Cables: '🔌', Grouting: '💧', Chemical: '🧪',
  Hardware: '🔩', Timber: '🪵', PVC: '🔷', Other: '📦',
};

const EMPTY = {
  material_code: '', name: '', unit_of_measure: 'bags', category: 'Cement',
  standard_rate: 0, description: '', reorder_level: 0,
};

const MaterialMaster = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [alert, setAlert]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMaterials({ search: search || undefined, category: filterCat || undefined });
      setMaterials(Array.isArray(data) ? data : (data?.materials || []));
    } catch(e) { setAlert({ type: 'error', message: 'Failed to load materials' }); }
    finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setFormError(''); setModalOpen(true); };
  const openEdit   = (m)  => {
    setEditTarget(m);
    setForm({ material_code: m.material_code, name: m.name, unit_of_measure: m.unit_of_measure, category: m.category, standard_rate: m.standard_rate, description: m.description || '', reorder_level: m.reorder_level || 0 });
    setFormError(''); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setFormLoading(true);
    try {
      const payload = { ...form, standard_rate: parseFloat(form.standard_rate) || 0, reorder_level: parseFloat(form.reorder_level) || 0 };
      if (editTarget) { await updateMaterial(editTarget.id, payload); setAlert({ type: 'success', message: `${form.name} updated.` }); }
      else            { await createMaterial(payload); setAlert({ type: 'success', message: `${form.name} added to catalog.` }); }
      setModalOpen(false); load();
    } catch(err) { setFormError(err.response?.data?.message || 'Error saving material'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Deactivate "${m.name}"?`)) return;
    try { await deleteMaterial(m.id); setAlert({ type: 'success', message: `${m.name} deactivated.` }); load(); }
    catch(e) { setAlert({ type: 'error', message: e.response?.data?.message || 'Error' }); }
  };

  // Stats
  const catCounts = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: materials.filter(m => m.category === c).length }), {});
  const active    = materials.filter(m => m.is_active).length;

  const HEADER_STYLE = { background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)', color: '#fff' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📦 Material Master Catalog</h1>
          <p className="page-subtitle">Manage construction materials — cement, steel, cables, grouting, hardware and more</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Material</button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.message}
          <button style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      {/* Category KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[{ cat: 'All', count: active, icon: '📦' }, ...CATEGORIES.map(c => ({ cat: c, count: catCounts[c] || 0, icon: CAT_ICONS[c] }))].map(item => (
          <div key={item.cat} className="card"
            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', border: filterCat === (item.cat === 'All' ? '' : item.cat) ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}
            onClick={() => setFilterCat(item.cat === 'All' ? '' : item.cat)}>
            <div style={{ fontSize: '1.3rem' }}>{item.icon}</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>{item.count}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{item.cat}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16, padding: '1rem' }}>
        <input className="form-control" placeholder="🔍 Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={HEADER_STYLE}>
                {['Code', 'Name', 'Category', 'Unit', 'Rate (AED)', 'Reorder Level', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.82rem', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No materials found. Add your first material →</td></tr>
              ) : materials.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>{m.material_code}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                    <span style={{ marginRight: 6 }}>{CAT_ICONS[m.category]}</span>{m.name}
                    {m.description && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{m.description.slice(0,60)}{m.description.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: 4, fontSize: '0.76rem', fontWeight: 600 }}>{m.category}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>{m.unit_of_measure}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#16a34a' }}>AED {parseFloat(m.standard_rate || 0).toFixed(2)}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{m.reorder_level} {m.unit_of_measure}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: m.is_active ? '#f0fdf4' : '#fef2f2', color: m.is_active ? '#16a34a' : '#dc2626', padding: '3px 8px', borderRadius: 4, fontSize: '0.76rem', fontWeight: 700 }}>
                      {m.is_active ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(m)} className="btn btn-sm" style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '5px 10px' }}>✏️ Edit</button>
                      {m.is_active && <button onClick={() => handleDelete(m)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '5px 10px' }}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Material' : 'Add New Material'} subtitle="Define material code, unit, category and pricing" icon="📦" size="lg">
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert alert-error" style={{ marginBottom: 14 }}>❌ {formError}</div>}
          <div className="form-section">
            <div className="form-section-title">Material Identity</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Material Code <span style={{ color: 'red' }}>*</span></label>
                <input className="form-control" name="material_code" value={form.material_code} onChange={e => setForm(f => ({ ...f, material_code: e.target.value }))} required placeholder="e.g. CEM-OPC-001" disabled={!!editTarget} />
              </div>
              <div className="form-group">
                <label className="form-label">Category <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Material Name <span style={{ color: 'red' }}>*</span></label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Ordinary Portland Cement 43 Grade" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Specifications, brand notes…" />
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-title">Measurement & Pricing</div>
            <div className="grid-3" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Unit of Measure <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" value={form.unit_of_measure} onChange={e => setForm(f => ({ ...f, unit_of_measure: e.target.value }))}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rate per Unit (AED)</label>
                <input type="number" step="0.01" className="form-control" value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input type="number" step="0.01" className="form-control" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} placeholder="Alert when below…" />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <><span className="spinner" /> Saving…</> : (editTarget ? '💾 Save Changes' : '➕ Add Material')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaterialMaster;
