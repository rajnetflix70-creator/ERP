import React, { useState, useEffect, useCallback } from 'react';
import { getSiteStock, logConsumption, getConsumptionHistory } from '../api/materials';
import { getMaterials } from '../api/materials';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const CAT_COLORS = {
  Cement: '#ea580c', Steel: '#64748b', Cables: '#7c3aed', Grouting: '#0891b2',
  Chemical: '#16a34a', Hardware: '#b45309', Timber: '#92400e', PVC: '#2563eb', Other: '#475569',
};

const SiteStock = () => {
  const [stock, setStock]           = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [projects, setProjects]     = useState([]);
  const [workPackages, setWorkPackages] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [alert, setAlert]           = useState(null);
  const [filterProject, setFilterProject] = useState('');
  const [showLowOnly, setShowLowOnly]     = useState(false);

  // Consumption log modal
  const [conModal, setConModal]   = useState(false);
  const [conForm, setConForm]     = useState({ material_id: '', project_id: '', work_package_id: '', qty_consumed: '', consumption_date: new Date().toISOString().slice(0,10), notes: '' });
  const [conLoading, setConLoading] = useState(false);
  const [conError, setConError]   = useState('');

  // History panel
  const [historyItem, setHistoryItem] = useState(null);
  const [history, setHistory]         = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, p] = await Promise.all([
        getSiteStock({ project_id: filterProject || undefined }),
        getMaterials({ is_active: true }),
        apiClient.get('/projects').then(r => r.data),
      ]);
      setStock(s); setMaterials(m); setProjects(p);
    } catch(e) { setAlert({ type: 'error', message: 'Failed to load stock data' }); }
    finally { setLoading(false); }
  }, [filterProject]);

  useEffect(() => { load(); }, [load]);

  const loadWPs = async (projectId) => {
    if (!projectId) { setWorkPackages([]); return; }
    try { const r = await apiClient.get('/work-packages', { params: { project_id: projectId } }); setWorkPackages(r.data); }
    catch(e) { setWorkPackages([]); }
  };

  const openConModal = (stockRow) => {
    setConForm({ material_id: stockRow.material_id, project_id: stockRow.project_id || '', work_package_id: '', qty_consumed: '', consumption_date: new Date().toISOString().slice(0,10), notes: '' });
    setConError(''); setConModal(true);
    if (stockRow.project_id) loadWPs(stockRow.project_id);
  };

  const handleConsumption = async (e) => {
    e.preventDefault(); setConError(''); setConLoading(true);
    try {
      const payload = { ...conForm, qty_consumed: parseFloat(conForm.qty_consumed) };
      if (!payload.work_package_id) delete payload.work_package_id;
      if (!payload.project_id) delete payload.project_id;
      await logConsumption(payload);
      setAlert({ type: 'success', message: `${conForm.qty_consumed} units consumption recorded.` });
      setConModal(false); load();
    } catch(err) { setConError(err.response?.data?.message || 'Error recording consumption'); }
    finally { setConLoading(false); }
  };

  const openHistory = async (row) => {
    setHistoryItem(row); setHistLoading(true);
    try {
      const h = await getConsumptionHistory({ material_id: row.material_id, project_id: row.project_id });
      setHistory(h);
    } catch(e) { setHistory([]); }
    finally { setHistLoading(false); }
  };

  const displayed = showLowOnly ? stock.filter(s => s.is_low_stock) : stock;
  const lowCount  = stock.filter(s => s.is_low_stock).length;
  const totalValue = stock.reduce((sum, s) => sum + (parseFloat(s.balance_value) || 0), 0);

  // Group by category
  const grouped = displayed.reduce((acc, row) => {
    const cat = row.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(row);
    return acc;
  }, {});

  const HEADER_STYLE = { background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)', color: '#fff' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📊 Site Material Stock</h1>
          <p className="page-subtitle">Per-project material balance — issued, consumed, and available stock with low-stock alerts</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setConForm({ material_id: '', project_id: '', work_package_id: '', qty_consumed: '', consumption_date: new Date().toISOString().slice(0,10), notes: '' }); setConError(''); setConModal(true); }}>
          + Log Consumption
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.message}
          <button style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Materials', value: stock.length, icon: '📦', color: '#2563eb' },
          { label: 'Low Stock Alerts', value: lowCount, icon: '⚠️', color: '#dc2626' },
          { label: 'Total Stock Value', value: `AED ${totalValue.toFixed(0)}`, icon: '💰', color: '#16a34a' },
          { label: 'Projects Tracked', value: [...new Set(stock.map(s => s.project_id))].length, icon: '🏗️', color: '#7c3aed' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem' }}>{kpi.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Low stock alert banner */}
      {lowCount > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#dc2626' }}>{lowCount} material{lowCount > 1 ? 's' : ''} below reorder level</div>
            <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Immediate restocking required to avoid site delays</div>
          </div>
          <button className="btn btn-sm" style={{ marginInlineStart: 'auto', background: '#dc2626', color: '#fff', border: 'none' }} onClick={() => setShowLowOnly(lo => !lo)}>
            {showLowOnly ? 'Show All' : '⚠️ Show Low Stock Only'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Filter by Project</label>
            <select className="form-control" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name} {p.ak_job_no ? `(${p.ak_job_no})` : ''}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      {/* Stock table grouped by category */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : displayed.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No stock records found. Issue materials to projects to see them here.</div>
      ) : (
        Object.entries(grouped).map(([cat, rows]) => (
          <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: CAT_COLORS[cat] || '#475569', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{cat}</span>
              <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700 }}>{rows.length} materials</span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', marginLeft: 'auto' }}>
                AED {rows.reduce((s, r) => s + (parseFloat(r.balance_value) || 0), 0).toFixed(0)} value
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={HEADER_STYLE}>
                    {['Material', 'Project', 'Received', 'Consumed', 'Returned', 'Balance', 'Reorder Lvl', 'Stock Value', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const balance = parseFloat(row.balance_qty) || 0;
                    const reorder = parseFloat(row.reorder_level) || 0;
                    const isLow   = row.is_low_stock;
                    return (
                      <tr key={row.id} style={{ background: isLow ? '#fef2f2' : (i % 2 === 0 ? '#fff' : '#f8fafc'), borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.material_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{row.unit_of_measure}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#475569' }}>{row.project_name || row.site_name || '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>{parseFloat(row.received_qty) || 0}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ea580c' }}>{parseFloat(row.issued_qty)   || 0}</td>
                        <td style={{ padding: '10px 12px', color: '#16a34a' }}>{parseFloat(row.returned_qty) || 0}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? '#dc2626' : '#16a34a' }}>
                            {balance.toFixed(1)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 4 }}>{row.unit_of_measure}</span>
                          {isLow && <div style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700 }}>⚠️ BELOW REORDER</div>}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.82rem' }}>{reorder} {row.unit_of_measure}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a', fontSize: '0.82rem' }}>
                          AED {parseFloat(row.balance_value || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-sm" style={{ background: '#fff7ed', color: '#ea580c', border: 'none', fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => openConModal(row)}>📉 Consume</button>
                            <button className="btn btn-sm" style={{ background: '#f8fafc', color: '#64748b', border: 'none', fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => openHistory(row)}>📋 History</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Consumption log modal */}
      <Modal isOpen={conModal} onClose={() => setConModal(false)} title="Log Material Consumption" subtitle="Record material used at site for a work package" icon="📉" size="lg">
        <form onSubmit={handleConsumption}>
          {conError && <div className="alert alert-error" style={{ marginBottom: 14 }}>❌ {conError}</div>}
          <div className="form-section">
            <div className="form-section-title">Consumption Details</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Project <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" value={conForm.project_id} onChange={e => { setConForm(f => ({ ...f, project_id: e.target.value })); loadWPs(e.target.value); }} required>
                  <option value="">Select Project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Material <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" value={conForm.material_id} onChange={e => setConForm(f => ({ ...f, material_id: e.target.value }))} required>
                  <option value="">Select Material…</option>
                  {materials.map(m => <option key={m.id} value={m.id}>[{m.material_code}] {m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Quantity Consumed <span style={{ color: 'red' }}>*</span></label>
                <input type="number" className="form-control" step="0.01" value={conForm.qty_consumed} onChange={e => setConForm(f => ({ ...f, qty_consumed: e.target.value }))} required placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Date <span style={{ color: 'red' }}>*</span></label>
                <input type="date" className="form-control" value={conForm.consumption_date} onChange={e => setConForm(f => ({ ...f, consumption_date: e.target.value }))} required />
              </div>
            </div>
            {workPackages.length > 0 && (
              <div className="form-group">
                <label className="form-label">Link to Work Package</label>
                <select className="form-control" value={conForm.work_package_id} onChange={e => setConForm(f => ({ ...f, work_package_id: e.target.value }))}>
                  <option value="">Not linked to specific task</option>
                  {workPackages.map(wp => <option key={wp.id} value={wp.id}>{wp.title}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={conForm.notes} onChange={e => setConForm(f => ({ ...f, notes: e.target.value }))} placeholder="Purpose, location, remarks…" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setConModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={conLoading}>
              {conLoading ? <><span className="spinner" /> Saving…</> : '📉 Record Consumption'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History side panel */}
      {historyItem && (
        <div style={{ position: 'fixed', right: 0, top: 0, width: 360, height: '100vh', background: '#fff', boxShadow: '-4px 0 30px rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#fff', fontWeight: 800, flex: 1 }}>📋 {historyItem.material_name}</span>
            <button onClick={() => setHistoryItem(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: '#fff', padding: '4px 10px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Project: <strong>{historyItem.project_name}</strong></div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Balance: <strong style={{ color: historyItem.is_low_stock ? '#dc2626' : '#16a34a' }}>{parseFloat(historyItem.balance_qty).toFixed(1)} {historyItem.unit_of_measure}</strong></div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {histLoading ? <div className="loading-center"><div className="spinner" /></div> :
             history.length === 0 ? <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>No consumption history yet</div> :
             history.map(h => (
               <div key={h.id} style={{ borderLeft: '3px solid #ea580c', padding: '8px 12px', marginBottom: 10, background: '#fff7ed', borderRadius: '0 8px 8px 0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                   <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{h.consumption_date?.slice(0,10)}</span>
                   <span style={{ fontWeight: 800, color: '#ea580c' }}>-{h.qty_consumed} {historyItem.unit_of_measure}</span>
                 </div>
                 {h.work_package_title && <div style={{ fontSize: '0.74rem', color: '#7c3aed' }}>📋 {h.work_package_title}</div>}
                 {h.notes && <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{h.notes}</div>}
                 {h.logged_by_name && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>👤 {h.logged_by_name}</div>}
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteStock;
