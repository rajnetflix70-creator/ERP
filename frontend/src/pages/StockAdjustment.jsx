import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const ADJUSTMENT_TYPES = [
  { value: 'Physical Count Reconciliation', label: '📊 Physical Count Reconciliation' },
  { value: 'Damage / Breakage', label: '💥 Damage / Breakage (-)' },
  { value: 'Scrap / Wastage', label: '🗑️ Scrap / Site Wastage (-)' },
  { value: 'Expired / Degraded', label: '⏳ Expired / Quality Degraded (-)' },
  { value: 'Excess Stock Found', label: '📦 Excess Stock Found (+)' },
  { value: 'Inventory Write-Off', label: '📝 Audit Write-Off (-)' },
];

const StockAdjustment = () => {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [viewAdj, setViewAdj] = useState(null);

  // Form State
  const initialForm = {
    ref_no: `ADJ-${dayjs().format('YYYY')}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: dayjs().format('YYYY-MM-DD'),
    site_name: '',
    material_id: '',
    material_name: '',
    system_qty: 0,
    physical_qty: '',
    adjustment_type: 'Physical Count Reconciliation',
    unit: 'Nos',
    reason: '',
  };

  const [form, setForm] = useState(initialForm);

  // Load live materials and sites
  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, siteRes] = await Promise.allSettled([
        apiClient.get('/materials?limit=200'),
        apiClient.get('/sites?limit=100'),
      ]);

      if (matRes.status === 'fulfilled') {
        const rawM = matRes.value?.data?.data?.data || matRes.value?.data?.data || matRes.value?.data || [];
        if (Array.isArray(rawM)) setMaterials(rawM);
      }

      if (siteRes.status === 'fulfilled') {
        const rawS = siteRes.value?.data?.data || siteRes.value?.data || [];
        if (Array.isArray(rawS)) setSites(rawS);
      }

      setAdjustments([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveAdjustmentsToStorage = (updated) => {
    setAdjustments(updated);
  };

  const handleMaterialChange = (matId) => {
    const found = materials.find(m => String(m.id) === String(matId));
    const currentStock = found ? Number(found.stock_quantity || found.current_stock || 0) : 0;
    setForm(prev => ({
      ...prev,
      material_id: matId,
      material_name: found ? (found.name || found.material_name) : '',
      unit: found ? (found.unit || 'Nos') : 'Nos',
      system_qty: currentStock,
    }));
  };

  const calculatedVariance = useMemo(() => {
    if (form.physical_qty === '' || isNaN(form.physical_qty)) return 0;
    return Number(form.physical_qty) - Number(form.system_qty);
  }, [form.physical_qty, form.system_qty]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.site_name) {
      setAlert({ type: 'danger', message: 'Please select a site / store location.' });
      return;
    }
    if (!form.material_name || form.physical_qty === '') {
      setAlert({ type: 'danger', message: 'Please select a material and enter physical counted quantity.' });
      return;
    }

    const variance = Number(form.physical_qty) - Number(form.system_qty);

    const newAdj = {
      id: Date.now(),
      ...form,
      physical_qty: Number(form.physical_qty),
      system_qty: Number(form.system_qty),
      variance,
      adjusted_by: user?.full_name || 'Super Admin',
      created_at: new Date().toISOString(),
    };

    const updated = [newAdj, ...adjustments];
    saveAdjustmentsToStorage(updated);
    setShowModal(false);
    setForm({
      ...initialForm,
      ref_no: `ADJ-${dayjs().format('YYYY')}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setAlert({ type: 'success', message: `Adjustment ${newAdj.ref_no} recorded successfully.` });
    setTimeout(() => setAlert(null), 4000);
  };

  const filtered = useMemo(() => {
    return adjustments.filter(a => {
      const matchSearch =
        !search ||
        (a.ref_no || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.material_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.reason || '').toLowerCase().includes(search.toLowerCase());

      const matchSite = !siteFilter || a.site_name === siteFilter;
      const matchType = !typeFilter || a.adjustment_type === typeFilter;

      return matchSearch && matchSite && matchType;
    });
  }, [adjustments, search, siteFilter, typeFilter]);

  const totalAdjustments = adjustments.length;
  const positiveCount = adjustments.filter(a => a.variance > 0).length;
  const negativeCount = adjustments.filter(a => a.variance < 0).length;

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {alert && (
        <div
          className={`alert ${alert.type === 'danger' ? 'alert-danger' : 'alert-success'}`}
          style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚖️</span> Stock Adjustment & Physical Reconciliation
          </h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Reconcile physical stock counts with system balances, log damages, site wastage, and inventory corrections.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ padding: '9px 18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>➕</span> + New Stock Adjustment
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Adjustments</span>
            <span style={{ fontSize: '1.2rem' }}>📝</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#1e293b' }}>{totalAdjustments}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Audited inventory adjustment entries</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Excess Found (+)</span>
            <span style={{ fontSize: '1.2rem' }}>📈</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#16a34a' }}>{positiveCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px' }}>Positive count corrections</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Deficit / Scrap (-)</span>
            <span style={{ fontSize: '1.2rem' }}>📉</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#ef4444' }}>{negativeCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '4px' }}>Damaged, wastage or deficit write-offs</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Active Sites</span>
            <span style={{ fontSize: '1.2rem' }}>🏗️</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#8b5cf6' }}>{sites.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#8b5cf6', marginTop: '4px' }}>Locations undergoing physical audit</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search Reference No, Material, Reason..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select className="form-control" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="">All Sites & Locations</option>
              <option value="Central Store">Central Store / Main Warehouse</option>
              {sites.map(s => (
                <option key={s.id || s.name} value={s.name || s.site_name}>{s.name || s.site_name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Adjustment Types</option>
              {ADJUSTMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px' }}>Ref No</th>
                <th>Date</th>
                <th>Site / Store</th>
                <th>Material</th>
                <th>System Stock</th>
                <th>Physical Count</th>
                <th>Variance</th>
                <th>Adjustment Type</th>
                <th>Reason / Notes</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚖️</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>No Stock Adjustments Found</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "+ New Stock Adjustment" to record physical audit variances.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{a.ref_no}</td>
                    <td>{a.date}</td>
                    <td><span style={{ fontWeight: 600, color: '#1e293b' }}>{a.site_name}</span></td>
                    <td><div style={{ fontWeight: 600, color: '#1e293b' }}>{a.material_name}</div></td>
                    <td>{a.system_qty} {a.unit}</td>
                    <td><strong>{a.physical_qty}</strong> {a.unit}</td>
                    <td>
                      {a.variance > 0 ? (
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>+{a.variance} {a.unit}</span>
                      ) : a.variance < 0 ? (
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>{a.variance} {a.unit}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>0 {a.unit}</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>{a.adjustment_type}</span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.reason || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setViewAdj(a)}
                        title="View Details"
                        style={{ padding: '4px 8px' }}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="➕ Record Physical Stock Adjustment" maxWidth="680px">
        <form onSubmit={handleSubmit} style={{ padding: '8px 4px' }}>
          <div className="grid-2" style={{ gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Reference Number</label>
              <input type="text" className="form-control" value={form.ref_no} readOnly style={{ background: '#f8fafc' }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Adjustment Date</label>
              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Site / Warehouse Location *</label>
              <select
                className="form-control"
                value={form.site_name}
                onChange={e => setForm({ ...form, site_name: e.target.value })}
                required
              >
                <option value="">-- Select Location --</option>
                <option value="Central Store">Central Store / Main Warehouse</option>
                {sites.map(s => (
                  <option key={s.id || s.name} value={s.name || s.site_name}>{s.name || s.site_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Adjustment Classification *</label>
              <select
                className="form-control"
                value={form.adjustment_type}
                onChange={e => setForm({ ...form, adjustment_type: e.target.value })}
                required
              >
                {ADJUSTMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Material *</label>
            <select
              className="form-control"
              value={form.material_id}
              onChange={e => handleMaterialChange(e.target.value)}
              required
            >
              <option value="">-- Select Material from Catalog --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name || m.material_name} (Current: {m.stock_quantity || m.current_stock || 0} {m.unit || 'Nos'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid-3" style={{ gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>System Book Stock</label>
              <input type="text" className="form-control" value={`${form.system_qty} ${form.unit}`} readOnly style={{ background: '#f8fafc', fontWeight: 600 }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Physical Count *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="Counted Qty"
                value={form.physical_qty}
                onChange={e => setForm({ ...form, physical_qty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Calculated Variance</label>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: calculatedVariance > 0 ? '#dcfce7' : calculatedVariance < 0 ? '#fee2e2' : '#f1f5f9',
                  color: calculatedVariance > 0 ? '#15803d' : calculatedVariance < 0 ? '#b91c1c' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  height: '38px',
                }}
              >
                {calculatedVariance > 0 ? `+${calculatedVariance}` : calculatedVariance} {form.unit}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Reason for Variance / Audit Remarks *</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="e.g. Broken in handling during slab casting, stock count discrepancy verified by store manager..."
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>⚖️ Apply Stock Adjustment</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(viewAdj)} onClose={() => setViewAdj(null)} title="📄 Stock Adjustment Voucher" maxWidth="560px">
        {viewAdj && (
          <div style={{ padding: '8px 4px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ADJUSTMENT REF</span>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>{viewAdj.ref_no}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>DATE</span>
                  <div style={{ fontWeight: 600 }}>{viewAdj.date}</div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
                <div><strong>Location:</strong> {viewAdj.site_name}</div>
                <div><strong>Type:</strong> {viewAdj.adjustment_type}</div>
                <div><strong>Adjusted By:</strong> {viewAdj.adjusted_by}</div>
                <div><strong>Created At:</strong> {dayjs(viewAdj.created_at).format('DD MMM YYYY, HH:mm')}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>System Stock</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Physical Count</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{viewAdj.material_name}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{viewAdj.system_qty} {viewAdj.unit}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>{viewAdj.physical_qty} {viewAdj.unit}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: viewAdj.variance >= 0 ? '#16a34a' : '#ef4444' }}>
                      {viewAdj.variance > 0 ? `+${viewAdj.variance}` : viewAdj.variance} {viewAdj.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <strong>Reason:</strong> {viewAdj.reason}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setViewAdj(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Voucher</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockAdjustment;
