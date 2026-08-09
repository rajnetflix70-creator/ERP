import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projects';
import Modal from '../components/Modal';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'badge-present' },
  { value: 'needs_supervisor', label: 'Needs Supervisor', color: 'badge-absent' },
  { value: 'pending', label: 'Pending', color: 'badge-half-day' },
  { value: 'grouting_pending', label: 'Grouting Pending', color: 'badge-warning' },
  { value: 'strengthening', label: 'Strengthening', color: 'badge-asset' },
  { value: 'completed', label: 'Completed', color: 'badge-on-leave' },
  { value: 'stopped', label: 'Stopped', color: 'badge-absent' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

const EMPTY_FORM = {
  folder_no: '',
  ak_job_no: '',
  project_name: '',
  area_sqft: '',
  supervisor_names: '',
  supervisors_assigned: 0,
  supervisors_required: 0,
  technicians_required: 0,
  supervisors_available_march: 0,
  status: 'active',
  has_stressing_machine: false,
  has_onion_machine: false,
  has_gun_machine: false,
  has_grouting_machine: false,
  notes: '',
  is_active: true,
};

const ProjectMaster = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const data = await getProjects(params);
      setProjects(data);
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const pagedProjects = projects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (prj) => {
    setEditTarget(prj);
    setForm({
      folder_no: prj.folder_no || '',
      ak_job_no: prj.ak_job_no || '',
      project_name: prj.project_name || '',
      area_sqft: prj.area_sqft || '',
      supervisor_names: prj.supervisor_names || '',
      supervisors_assigned: prj.supervisors_assigned || 0,
      supervisors_required: prj.supervisors_required || 0,
      technicians_required: prj.technicians_required || 0,
      supervisors_available_march: prj.supervisors_available_march || 0,
      status: prj.status || 'active',
      has_stressing_machine: Boolean(prj.has_stressing_machine),
      has_onion_machine: Boolean(prj.has_onion_machine),
      has_gun_machine: Boolean(prj.has_gun_machine),
      has_grouting_machine: Boolean(prj.has_grouting_machine),
      notes: prj.notes || '',
      is_active: prj.is_active ?? true,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        area_sqft: form.area_sqft ? parseFloat(form.area_sqft) : null,
        supervisors_assigned: parseInt(form.supervisors_assigned) || 0,
        supervisors_required: parseInt(form.supervisors_required) || 0,
        technicians_required: parseInt(form.technicians_required) || 0,
        supervisors_available_march: parseInt(form.supervisors_available_march) || 0,
      };

      if (editTarget) {
        await updateProject(editTarget.id, payload);
        setAlert({ type: 'success', message: `Project "${form.project_name}" updated successfully.` });
      } else {
        await createProject(payload);
        setAlert({ type: 'success', message: `Project "${form.project_name}" created successfully.` });
      }
      setModalOpen(false);
      loadProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (prj) => {
    if (!window.confirm(`Deactivate project "${prj.project_name}"?`)) return;
    try {
      await deleteProject(prj.id);
      setAlert({ type: 'success', message: `Project "${prj.project_name}" deactivated.` });
      loadProjects();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Deactivation failed' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏗 {t('nav.projectMaster', 'Project Master')}</h1>
        <p className="page-subtitle">Manage project master records, job codes, floor area, supervisor allocations, and equipment setup.</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <span>{alert.type === 'success' ? '✅' : '❌'}</span>
          <span>{alert.message}</span>
          <button
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            onClick={() => setAlert(null)}
          >✕</button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
            <label className="form-label">Search Project / Job No</label>
            <input
              className="form-control"
              placeholder="Filter by name or AK job code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadProjects}>🔍 Filter</button>
          <button className="btn btn-primary" style={{ marginInlineStart: 'auto' }} onClick={openCreate}>
            + Add Project
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏗</div>
            <h3>No projects found</h3>
            <p>Try clearing your search or add a new project.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Folder / Job No</th>
                <th>Project Details</th>
                <th>Area (sq ft)</th>
                <th>Supervisors</th>
                <th>Status</th>
                <th>Machines</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProjects.map((prj) => {
                const st = STATUS_MAP[prj.status] || { label: prj.status, color: 'badge-asset' };
                return (
                  <tr key={prj.id}>
                    <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      <span className="font-semibold" style={{ color: 'var(--color-header)' }}>
                        {prj.folder_no ? `#${prj.folder_no}` : '—'}
                      </span>
                      {prj.ak_job_no && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary-dk)' }}>{prj.ak_job_no}</div>
                      )}
                    </td>
                    <td>
                      <div className="font-semibold">{prj.project_name}</div>
                      {prj.supervisor_names && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          👤 {prj.supervisor_names}
                        </div>
                      )}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {prj.area_sqft ? prj.area_sqft.toLocaleString() : '—'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.88rem' }}>
                        <strong>{prj.supervisors_assigned || 0}</strong> assigned
                        {prj.supervisors_required > 0 && (
                          <span style={{ color: 'var(--color-danger)', marginInlineStart: 6, fontWeight: 700 }}>
                            ({prj.supervisors_required} needed)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${st.color}`}>{st.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {prj.has_stressing_machine && <span className="badge badge-asset" title="Stressing Machine">⚙ Stressing</span>}
                        {prj.has_onion_machine && <span className="badge badge-consumable" title="Onion / Flower Machine">🧅 Onion</span>}
                        {prj.has_gun_machine && <span className="badge badge-half-day" title="Gun Machine">🔫 Gun</span>}
                        {prj.has_grouting_machine && <span className="badge badge-present" title="Grouting Machine">💧 Grouting</span>}
                        {!prj.has_stressing_machine && !prj.has_onion_machine && !prj.has_gun_machine && !prj.has_grouting_machine && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(prj)}>✏ Edit</button>
                        {prj.is_active && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--color-danger-lt)', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)' }}
                            onClick={() => handleDelete(prj)}
                          >
                            🚫
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
          Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, projects.length)}–{Math.min(currentPage * PAGE_SIZE, projects.length)} of {projects.length} projects
        </p>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ minWidth: 36, opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              ◀
            </button>

            {(() => {
              const pages = [];
              const show = new Set([1, totalPages]);
              for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) show.add(i);
              const sorted = [...show].sort((a, b) => a - b);
              sorted.forEach((page, idx) => {
                if (idx > 0 && page - sorted[idx - 1] > 1) {
                  pages.push(<span key={`e${page}`} style={{ padding: '0 6px', color: 'var(--color-text-muted)', fontSize: '0.85rem', userSelect: 'none' }}>…</span>);
                }
                pages.push(
                  <button
                    key={page}
                    className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentPage(page)}
                    style={{ minWidth: 36, fontWeight: page === currentPage ? 700 : 400 }}
                  >
                    {page}
                  </button>
                );
              });
              return pages;
            })()}

            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ minWidth: 36, opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Project' : 'Add New Project'} subtitle={editTarget ? `Updating ${editTarget.project_name}` : 'Enter project details and resource allocation'} icon="🏗" size="lg">
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>❌ {formError}</div>}

          <div className="form-section">
            <div className="form-section-title">Project Identity</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Folder No</label>
                <input className="form-control" name="folder_no" value={form.folder_no} onChange={handleFormChange} placeholder="e.g. 109" />
              </div>
              <div className="form-group">
                <label className="form-label">AK Job No</label>
                <input className="form-control" name="ak_job_no" value={form.ak_job_no} onChange={handleFormChange} placeholder="e.g. AK-23-037" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Project Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input className="form-control" name="project_name" value={form.project_name} onChange={handleFormChange} required placeholder="Client / Contractor & Project Name" />
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Area (sq ft)</label>
                <input type="number" step="any" className="form-control" name="area_sqft" value={form.area_sqft} onChange={handleFormChange} placeholder="e.g. 47458" />
              </div>
              <div className="form-group">
                <label className="form-label">Status <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select className="form-control" name="status" value={form.status} onChange={handleFormChange}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Supervisor Allocation</div>
            <div className="form-group">
              <label className="form-label">Assigned Supervisor Name(s)</label>
              <input className="form-control" name="supervisor_names" value={form.supervisor_names} onChange={handleFormChange} placeholder="Comma-separated supervisor names" />
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Assigned</label>
                <input type="number" min="0" className="form-control" name="supervisors_assigned" value={form.supervisors_assigned} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Needed</label>
                <input type="number" min="0" className="form-control" name="supervisors_required" value={form.supervisors_required} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Techs Needed</label>
                <input type="number" min="0" className="form-control" name="technicians_required" value={form.technicians_required} onChange={handleFormChange} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Equipment Allocated</div>
            <div className="grid-2" style={{ gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', cursor: 'pointer', background: form.has_stressing_machine ? 'rgba(37,99,235,0.06)' : 'white', transition: 'all 0.15s' }}>
                <input type="checkbox" name="has_stressing_machine" checked={form.has_stressing_machine} onChange={handleFormChange} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} /> ⚙ Stressing Machine
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', cursor: 'pointer', background: form.has_onion_machine ? 'rgba(37,99,235,0.06)' : 'white', transition: 'all 0.15s' }}>
                <input type="checkbox" name="has_onion_machine" checked={form.has_onion_machine} onChange={handleFormChange} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} /> 🧅 Onion Machine
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', cursor: 'pointer', background: form.has_gun_machine ? 'rgba(37,99,235,0.06)' : 'white', transition: 'all 0.15s' }}>
                <input type="checkbox" name="has_gun_machine" checked={form.has_gun_machine} onChange={handleFormChange} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} /> 🔫 Gun Machine
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', cursor: 'pointer', background: form.has_grouting_machine ? 'rgba(37,99,235,0.06)' : 'white', transition: 'all 0.15s' }}>
                <input type="checkbox" name="has_grouting_machine" checked={form.has_grouting_machine} onChange={handleFormChange} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} /> 💧 Grouting Machine
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Additional Notes</div>
            <div className="form-group">
              <textarea className="form-control" name="notes" rows="2" value={form.notes} onChange={handleFormChange} placeholder="Additional project specifications or status notes…" />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <><span className="spinner" /> Saving…</> : (editTarget ? '💾 Save Changes' : '➕ Add Project')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectMaster;
