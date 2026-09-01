import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getKanbanBoard, createWorkPackage, updateWorkPackage, deleteWorkPackage, logProgress, getProgressLogs } from '../api/workPackages';
import { getProjects } from '../api/projects';
import { getEmployees } from '../api/employees';
import apiClient from '../api/client';
import Modal from '../components/Modal';

/* ── Constants ─────────────────────────────────────────────────── */
const COLUMNS = [
  { key: 'not_started', label: '📋 Not Started',  color: '#64748b', bg: '#f1f5f9' },
  { key: 'in_progress', label: '🔄 In Progress',   color: '#2563eb', bg: '#eff6ff' },
  { key: 'blocked',     label: '🚫 Blocked',        color: '#dc2626', bg: '#fef2f2' },
  { key: 'delayed',     label: '⏰ Delayed',         color: '#d97706', bg: '#fffbeb' },
  { key: 'completed',   label: '✅ Completed',       color: '#16a34a', bg: '#f0fdf4' },
];

const PRIORITY_BADGE = {
  critical: { label: '🔴 Critical', color: '#dc2626', bg: '#fef2f2' },
  high:     { label: '🟠 High',     color: '#ea580c', bg: '#fff7ed' },
  medium:   { label: '🟡 Medium',   color: '#ca8a04', bg: '#fefce8' },
  low:      { label: '🟢 Low',      color: '#16a34a', bg: '#f0fdf4' },
};

const EMPTY_FORM = {
  project_id: '', site_id: '', title: '', description: '',
  status: 'not_started', priority: 'medium', assigned_to: '',
  planned_start: '', planned_end: '', completion_pct: 0, blocked_reason: '',
};

const EMPTY_LOG = { log_date: new Date().toISOString().slice(0,10), work_description: '', qty_completed: '', qty_unit: '', completion_pct: '', status_after: '', issues_encountered: '' };

/* ── Component ─────────────────────────────────────────────────── */
const ProjectManagement = () => {
  const [board, setBoard]             = useState({ not_started: [], in_progress: [], blocked: [], delayed: [], completed: [] });
  const [projects, setProjects]       = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [sites, setSites]             = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading]         = useState(true);
  const [alert, setAlert]             = useState(null);

  // Form modal
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState('');

  // Progress log modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTarget, setLogTarget]       = useState(null);
  const [logForm, setLogForm]           = useState(EMPTY_LOG);
  const [logs, setLogs]                 = useState([]);
  const [logLoading, setLogLoading]     = useState(false);

  // Detail drawer
  const [drawerWp, setDrawerWp]       = useState(null);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getKanbanBoard(selectedProject || undefined);
      setBoard({
        not_started: Array.isArray(data?.not_started) ? data.not_started : [],
        in_progress: Array.isArray(data?.in_progress) ? data.in_progress : [],
        blocked:     Array.isArray(data?.blocked)     ? data.blocked     : [],
        delayed:     Array.isArray(data?.delayed)     ? data.delayed     : [],
        completed:   Array.isArray(data?.completed)   ? data.completed   : [],
      });
    } catch(e) {
      setAlert({ type: 'error', message: 'Failed to load board' });
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadBoard();
    getProjects().then(r => setProjects(Array.isArray(r) ? r : (r?.projects || []))).catch(() => setProjects([]));
    getEmployees().then(r => setEmployees(Array.isArray(r) ? r : (r?.employees || []))).catch(() => setEmployees([]));
    apiClient.get('/projects').then(r => setSites(Array.isArray(r?.data) ? r.data : [])).catch(() => setSites([]));
  }, [loadBoard]);

  /* ── Form Handlers ──────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, project_id: selectedProject });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (wp) => {
    setEditTarget(wp);
    setForm({
      project_id: wp.project_id || '',
      site_id: wp.site_id || '',
      title: wp.title || '',
      description: wp.description || '',
      status: wp.status || 'not_started',
      priority: wp.priority || 'medium',
      assigned_to: wp.assigned_to || '',
      planned_start: wp.planned_start ? wp.planned_start.slice(0, 10) : '',
      planned_end: wp.planned_end ? wp.planned_end.slice(0, 10) : '',
      completion_pct: wp.completion_pct || 0,
      blocked_reason: wp.blocked_reason || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.site_id) delete payload.site_id;
      if (!payload.planned_start) delete payload.planned_start;
      if (!payload.planned_end) delete payload.planned_end;
      payload.completion_pct = parseFloat(payload.completion_pct) || 0;

      if (editTarget) {
        await updateWorkPackage(editTarget.id, payload);
        setAlert({ type: 'success', message: `"${form.title}" updated.` });
      } else {
        await createWorkPackage(payload);
        setAlert({ type: 'success', message: `"${form.title}" created.` });
      }
      setModalOpen(false);
      loadBoard();
    } catch(err) {
      setFormError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (wp) => {
    if (!window.confirm(`Delete work package "${wp.title}"? This cannot be undone.`)) return;
    try {
      await deleteWorkPackage(wp.id);
      setAlert({ type: 'success', message: `"${wp.title}" deleted.` });
      loadBoard();
    } catch(e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Delete failed' });
    }
  };

  /* ── Quick Status Change ──────────────────────────────── */
  const handleQuickStatus = async (wp, newStatus) => {
    try {
      await updateWorkPackage(wp.id, { status: newStatus });
      loadBoard();
    } catch(e) {
      setAlert({ type: 'error', message: 'Status update failed' });
    }
  };

  /* ── Progress Log ──────────────────────────────────────── */
  const openLogModal = async (wp) => {
    setLogTarget(wp);
    setLogForm({ ...EMPTY_LOG });
    setLogLoading(true);
    setLogModalOpen(true);
    try {
      const data = await getProgressLogs(wp.id);
      setLogs(data);
    } catch(e) { setLogs([]); }
    finally { setLogLoading(false); }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      const payload = { ...logForm };
      if (!payload.qty_completed) delete payload.qty_completed;
      if (!payload.qty_unit) delete payload.qty_unit;
      if (!payload.completion_pct) delete payload.completion_pct;
      if (!payload.status_after) delete payload.status_after;
      if (!payload.issues_encountered) delete payload.issues_encountered;
      if (payload.completion_pct) payload.completion_pct = parseFloat(payload.completion_pct);

      await logProgress(logTarget.id, payload);
      setAlert({ type: 'success', message: 'Progress logged successfully.' });
      const updated = await getProgressLogs(logTarget.id);
      setLogs(updated);
      setLogForm({ ...EMPTY_LOG });
      loadBoard();
    } catch(err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Log failed' });
    } finally {
      setLogLoading(false);
    }
  };

  /* ── Stats ──────────────────────────────────────────────── */
  const totalWPs   = COLUMNS.reduce((acc, c) => acc + (board[c.key]?.length || 0), 0);
  const doneWPs    = board.completed?.length || 0;
  const blockedWPs = board.blocked?.length   || 0;
  const inProgWPs  = board.in_progress?.length || 0;
  const overallPct = totalWPs > 0 ? Math.round((doneWPs / totalWPs) * 100) : 0;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📋 Project Work Packages</h1>
          <p className="page-subtitle">Kanban board — plan, assign, and track work packages across projects</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Work Package</button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <span>{alert.type === 'success' ? '✅' : '❌'} {alert.message}</span>
          <button style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Tasks', value: totalWPs, icon: '📋', color: '#2563eb' },
          { label: 'In Progress', value: inProgWPs, icon: '🔄', color: '#7c3aed' },
          { label: 'Completed',   value: doneWPs,   icon: '✅', color: '#16a34a' },
          { label: 'Blocked',     value: blockedWPs, icon: '🚫', color: '#dc2626' },
          { label: 'Overall %',   value: `${overallPct}%`, icon: '📊', color: '#ea580c' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Filter by Project</label>
            <select className="form-control" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.ak_job_no ? `[${p.ak_job_no}] ` : ''}{p.project_name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-secondary btn-sm" onClick={loadBoard}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, alignItems: 'start' }}>
          {COLUMNS.map(col => (
            <div key={col.key} style={{ background: col.bg, borderRadius: 12, border: `2px solid ${col.color}22`, padding: '0 0 12px 0', minHeight: 200 }}>
              {/* Column Header */}
              <div style={{ padding: '12px 14px', borderBottom: `2px solid ${col.color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: col.color, fontSize: '0.88rem' }}>{col.label}</span>
                <span style={{ background: col.color, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {board[col.key]?.length || 0}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: '10px 10px 0 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(!board[col.key] || board[col.key].length === 0) ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px 0' }}>No tasks</div>
                ) : (
                  board[col.key].map(wp => {
                    const pri = PRIORITY_BADGE[wp.priority] || PRIORITY_BADGE.medium;
                    return (
                      <div key={wp.id} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '12px', border: `1px solid ${col.color}22` }}>
                        {/* Priority badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span style={{ background: pri.bg, color: pri.color, borderRadius: 4, padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{pri.label}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button title="Log Progress" onClick={() => openLogModal(wp)} style={{ background: '#eff6ff', border: 'none', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.72rem', color: '#2563eb' }}>📝</button>
                            <button title="Edit" onClick={() => openEdit(wp)} style={{ background: '#f8fafc', border: 'none', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.72rem' }}>✏️</button>
                            <button title="Delete" onClick={() => handleDelete(wp)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.72rem', color: '#dc2626' }}>🗑️</button>
                          </div>
                        </div>

                        {/* Title */}
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 4 }}>{wp.title}</div>

                        {/* Project */}
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: 6 }}>
                          🏗️ {wp.project_name || 'No Project'} {wp.ak_job_no ? `(${wp.ak_job_no})` : ''}
                        </div>

                        {/* Assignee */}
                        {wp.assigned_to_name && (
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: 4 }}>👤 {wp.assigned_to_name}</div>
                        )}

                        {/* Dates */}
                        {(wp.planned_start || wp.planned_end) && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 6 }}>
                            📅 {wp.planned_start ? wp.planned_start.slice(0,10) : '—'} → {wp.planned_end ? wp.planned_end.slice(0,10) : '—'}
                          </div>
                        )}

                        {/* Progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, parseFloat(wp.completion_pct) || 0)}%`, height: '100%', background: col.color, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: col.color }}>{parseFloat(wp.completion_pct) || 0}%</span>
                        </div>

                        {/* Quick status change */}
                        <select
                          value={wp.status}
                          onChange={e => handleQuickStatus(wp, e.target.value)}
                          style={{ width: '100%', fontSize: '0.73rem', padding: '4px 6px', border: `1px solid ${col.color}44`, borderRadius: 4, background: '#fff', cursor: 'pointer', color: col.color, fontWeight: 600 }}
                        >
                          {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Work Package Modal ─────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Work Package' : 'New Work Package'} subtitle="Define task details, assignee, dates and priority" icon="📋" size="lg">
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert alert-error" style={{ marginBottom: 14 }}>❌ {formError}</div>}

          <div className="form-section">
            <div className="form-section-title">Task Details</div>
            <div className="form-group">
              <label className="form-label">Title <span style={{ color: 'red' }}>*</span></label>
              <input className="form-control" name="title" value={form.title} onChange={handleFormChange} required placeholder="e.g. Install grouting cables — Block A" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Detailed scope of this task..." />
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Project <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" name="project_id" value={form.project_id} onChange={handleFormChange} required>
                  <option value="">Select Project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name} {p.ak_job_no ? `(${p.ak_job_no})` : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-control" name="assigned_to" value={form.assigned_to} onChange={handleFormChange}>
                  <option value="">Unassigned</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Status & Priority</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" name="status" value={form.status} onChange={handleFormChange}>
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" name="priority" value={form.priority} onChange={handleFormChange}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Completion % ({form.completion_pct}%)</label>
              <input type="range" name="completion_pct" value={form.completion_pct} min={0} max={100} onChange={handleFormChange}
                style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>
            {form.status === 'blocked' && (
              <div className="form-group">
                <label className="form-label">Blocked Reason</label>
                <input className="form-control" name="blocked_reason" value={form.blocked_reason} onChange={handleFormChange} placeholder="Why is this task blocked?" />
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="form-section-title">Schedule</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Planned Start</label>
                <input type="date" className="form-control" name="planned_start" value={form.planned_start} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Planned End</label>
                <input type="date" className="form-control" name="planned_end" value={form.planned_end} onChange={handleFormChange} />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <><span className="spinner" /> Saving…</> : (editTarget ? '💾 Save Changes' : '➕ Create Task')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Progress Log Modal ──────────────────────────────── */}
      <Modal isOpen={logModalOpen} onClose={() => setLogModalOpen(false)} title="Log Daily Progress" subtitle={logTarget ? `Task: ${logTarget.title}` : ''} icon="📝" size="lg">
        <form onSubmit={handleLogSubmit}>
          <div className="form-section">
            <div className="form-section-title">Today's Progress</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Date <span style={{ color: 'red' }}>*</span></label>
                <input type="date" className="form-control" value={logForm.log_date} onChange={e => setLogForm(f => ({ ...f, log_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Status After Log</label>
                <select className="form-control" value={logForm.status_after} onChange={e => setLogForm(f => ({ ...f, status_after: e.target.value }))}>
                  <option value="">No change</option>
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Work Done Today <span style={{ color: 'red' }}>*</span></label>
              <textarea className="form-control" rows={3} placeholder="Describe what was completed today…" value={logForm.work_description} onChange={e => setLogForm(f => ({ ...f, work_description: e.target.value }))} required />
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Quantity Completed</label>
                <input type="number" className="form-control" placeholder="e.g. 250" value={logForm.qty_completed} onChange={e => setLogForm(f => ({ ...f, qty_completed: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-control" placeholder="sqft / m / nos / bags" value={logForm.qty_unit} onChange={e => setLogForm(f => ({ ...f, qty_unit: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Updated Completion % {logForm.completion_pct ? `(${logForm.completion_pct}%)` : ''}</label>
              <input type="range" min={0} max={100} value={logForm.completion_pct || 0} onChange={e => setLogForm(f => ({ ...f, completion_pct: e.target.value }))}
                style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Issues / Blockers Encountered</label>
              <textarea className="form-control" rows={2} placeholder="Any issues blocking progress?" value={logForm.issues_encountered} onChange={e => setLogForm(f => ({ ...f, issues_encountered: e.target.value }))} />
            </div>
          </div>

          <div className="modal-actions" style={{ marginBottom: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={logLoading}>
              {logLoading ? <><span className="spinner" /> Saving…</> : '📝 Submit Progress'}
            </button>
          </div>
        </form>

        {/* History */}
        {logs.length > 0 && (
          <div className="form-section">
            <div className="form-section-title">Progress History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {logs.map(l => (
                <div key={l.id} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2563eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{l.log_date?.slice(0,10)}</span>
                    {l.completion_pct && <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 700 }}>{l.completion_pct}%</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>{l.work_description}</div>
                  {l.issues_encountered && <div style={{ fontSize: '0.76rem', color: '#dc2626', marginTop: 4 }}>⚠️ {l.issues_encountered}</div>}
                  {l.logged_by_name && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>👤 {l.logged_by_name}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectManagement;
