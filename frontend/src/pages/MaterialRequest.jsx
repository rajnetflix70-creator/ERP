import React, { useState, useEffect, useCallback } from 'react';
import { getMaterialRequests, createMaterialRequest, approveRequest, issueRequest } from '../api/materials';
import { getMaterials } from '../api/materials';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const STATUS_CONFIG = {
  pending:   { label: 'Pending Approval', color: '#ca8a04', bg: '#fefce8', icon: '⏳' },
  approved:  { label: 'Approved',         color: '#2563eb', bg: '#eff6ff', icon: '✅' },
  rejected:  { label: 'Rejected',         color: '#dc2626', bg: '#fef2f2', icon: '❌' },
  issued:    { label: 'Issued to Site',   color: '#16a34a', bg: '#f0fdf4', icon: '📤' },
  cancelled: { label: 'Cancelled',        color: '#64748b', bg: '#f8fafc', icon: '🚫' },
};

const PRIORITY_CONFIG = {
  urgent: { color: '#dc2626', bg: '#fef2f2', label: '🔴 Urgent' },
  normal: { color: '#2563eb', bg: '#eff6ff', label: '🔵 Normal' },
  low:    { color: '#64748b', bg: '#f8fafc', label: '⬜ Low'    },
};

const EMPTY_REQ = { project_id: '', site_id: '', material_id: '', qty_requested: '', date_needed: '', purpose: '', priority: 'normal' };

const MaterialRequest = () => {
  const [requests, setRequests]     = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [alert, setAlert]           = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [form, setForm]                 = useState(EMPTY_REQ);
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState('');

  // Approve/Reject modal
  const [approveModal, setApproveModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveAction, setApproveAction] = useState('approved');
  const [approveNotes, setApproveNotes]   = useState('');

  // Issue modal
  const [issueModal, setIssueModal]     = useState(false);
  const [issueTarget, setIssueTarget]   = useState(null);
  const [issueQty, setIssueQty]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, mats, projs] = await Promise.all([
        getMaterialRequests({ status: filterStatus || undefined }),
        getMaterials({ is_active: true }),
        apiClient.get('/projects').then(r => r.data),
      ]);
      setRequests(reqs); setMaterials(mats); setProjects(projs);
    } catch(e) { setAlert({ type: 'error', message: 'Failed to load requests' }); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError(''); setFormLoading(true);
    try {
      const payload = { ...form };
      if (!payload.site_id) delete payload.site_id;
      if (!payload.date_needed) delete payload.date_needed;
      payload.qty_requested = parseFloat(payload.qty_requested);
      await createMaterialRequest(payload);
      setAlert({ type: 'success', message: 'Material request submitted.' });
      setReqModalOpen(false); load();
    } catch(err) { setFormError(err.response?.data?.message || 'Error'); }
    finally { setFormLoading(false); }
  };

  const handleApprove = async () => {
    try {
      await approveRequest(approveTarget.id, { status: approveAction, approval_notes: approveNotes });
      setAlert({ type: 'success', message: `Request ${approveAction}.` });
      setApproveModal(false); setApproveNotes(''); load();
    } catch(e) { setAlert({ type: 'error', message: e.response?.data?.message || 'Error' }); }
  };

  const handleIssue = async () => {
    try {
      await issueRequest(issueTarget.id, { qty_issued: parseFloat(issueQty) });
      setAlert({ type: 'success', message: `${issueQty} ${issueTarget.unit_of_measure} issued to site.` });
      setIssueModal(false); load();
    } catch(e) { setAlert({ type: 'error', message: e.response?.data?.message || 'Error' }); }
  };

  // Stats
  const stats = Object.entries(STATUS_CONFIG).map(([k, v]) => ({ ...v, key: k, count: requests.filter(r => r.status === k).length }));

  const HEADER_STYLE = { background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)', color: '#fff' };
  const selectedMat = materials.find(m => m.id === form.material_id);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📤 Material Requests</h1>
          <p className="page-subtitle">Raise material requests from site → approve → issue to project site</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_REQ); setFormError(''); setReqModalOpen(true); }}>+ New Request</button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.message}
          <button style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      {/* Status KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[{ key:'', icon:'📋', label:'All', count: requests.length, color:'#2563eb', bg:'#eff6ff' }, ...stats].map(s => (
          <div key={s.key} className="card"
            style={{ padding: '0.85rem', textAlign: 'center', cursor: 'pointer', border: filterStatus === s.key ? `2px solid ${s.color}` : '2px solid transparent', background: filterStatus === s.key ? s.bg : '#fff', transition: 'all 0.15s' }}
            onClick={() => setFilterStatus(s.key)}>
            <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={HEADER_STYLE}>
                {['MR No.', 'Material', 'Project', 'Qty Requested', 'Date Needed', 'Priority', 'Status', 'Requested By', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No requests found.</td></tr>
              ) : requests.map((req, i) => {
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const pc = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.normal;
                return (
                  <tr key={req.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{req.mr_number}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.material_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{req.category}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.82rem' }}>
                      {req.project_name}<br />
                      {req.ak_job_no && <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>{req.ak_job_no}</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                      {req.qty_requested} <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{req.unit_of_measure}</span>
                      {req.qty_issued && <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>Issued: {req.qty_issued} {req.unit_of_measure}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.82rem' }}>{req.date_needed ? req.date_needed.slice(0,10) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: pc.bg, color: pc.color, padding: '3px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 700 }}>{pc.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: '3px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 700 }}>{sc.icon} {sc.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>{req.requested_by_name || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {req.status === 'pending' && (
                          <>
                            <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', fontSize: '0.72rem', padding: '4px 8px' }}
                              onClick={() => { setApproveTarget(req); setApproveAction('approved'); setApproveNotes(''); setApproveModal(true); }}>✅ Approve</button>
                            <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: 'none', fontSize: '0.72rem', padding: '4px 8px' }}
                              onClick={() => { setApproveTarget(req); setApproveAction('rejected'); setApproveNotes(''); setApproveModal(true); }}>❌ Reject</button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button className="btn btn-sm" style={{ background: '#eff6ff', color: '#2563eb', border: 'none', fontSize: '0.72rem', padding: '4px 8px' }}
                            onClick={() => { setIssueTarget(req); setIssueQty(req.qty_requested); setIssueModal(true); }}>📤 Issue</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      <Modal isOpen={reqModalOpen} onClose={() => setReqModalOpen(false)} title="New Material Request" subtitle="Submit a request to issue material to a project site" icon="📤" size="lg">
        <form onSubmit={handleCreate}>
          {formError && <div className="alert alert-error" style={{ marginBottom: 14 }}>❌ {formError}</div>}
          <div className="form-section">
            <div className="form-section-title">Request Details</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Project <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} required>
                  <option value="">Select Project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name} {p.ak_job_no ? `(${p.ak_job_no})` : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="normal">🔵 Normal</option>
                  <option value="low">⬜ Low</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Material <span style={{ color: 'red' }}>*</span></label>
              <select className="form-control" value={form.material_id} onChange={e => setForm(f => ({ ...f, material_id: e.target.value }))} required>
                <option value="">Select Material…</option>
                {materials.map(m => <option key={m.id} value={m.id}>[{m.material_code}] {m.name} ({m.unit_of_measure})</option>)}
              </select>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Quantity Required <span style={{ color: 'red' }}>*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" className="form-control" step="0.01" value={form.qty_requested} onChange={e => setForm(f => ({ ...f, qty_requested: e.target.value }))} required placeholder="0" />
                  {selectedMat && <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#f1f5f9', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{selectedMat.unit_of_measure}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date Needed</label>
                <input type="date" className="form-control" value={form.date_needed} onChange={e => setForm(f => ({ ...f, date_needed: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose / Scope</label>
              <textarea className="form-control" rows={3} value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="What will this material be used for?" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setReqModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <><span className="spinner" /> Submitting…</> : '📤 Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve / Reject Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title={approveAction === 'approved' ? 'Approve Request' : 'Reject Request'} icon={approveAction === 'approved' ? '✅' : '❌'} size="sm">
        {approveTarget && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>{approveTarget.material_name}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                {approveTarget.qty_requested} {approveTarget.unit_of_measure} — {approveTarget.project_name}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{approveAction === 'approved' ? 'Approval Notes' : 'Rejection Reason'}</label>
              <textarea className="form-control" rows={3} value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder="Optional notes…" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setApproveModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: approveAction === 'approved' ? '#16a34a' : '#dc2626' }} onClick={handleApprove}>
                {approveAction === 'approved' ? '✅ Approve' : '❌ Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Issue Modal */}
      <Modal isOpen={issueModal} onClose={() => setIssueModal(false)} title="Issue Material to Site" icon="📤" size="sm">
        {issueTarget && (
          <div>
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#2563eb' }}>{issueTarget.material_name}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>Approved qty: {issueTarget.qty_requested} {issueTarget.unit_of_measure}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity to Issue <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" className="form-control" step="0.01" value={issueQty} onChange={e => setIssueQty(e.target.value)} />
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#f1f5f9', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{issueTarget.unit_of_measure}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIssueModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={handleIssue}>📤 Issue to Site</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaterialRequest;
