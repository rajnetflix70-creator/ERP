import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getProjects, createProject, updateProject, deleteProject,
  getProjectDetails, batchSaveProjectSlabs, saveProjectSlab, deleteProjectSlab,
  createProjectDrawing, updateProjectDrawing, deleteProjectDrawing,
  addProjectSupervisor, deleteProjectSupervisor, saveProjectCommercials
} from '../api/projects';
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

  /* ── PT Details Modal States ── */
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [ptDetails, setPtDetails] = useState(null);
  const [ptActiveTab, setPtActiveTab] = useState('slabs'); // 'slabs', 'drawings', 'supervisors', 'commercials'
  const [ptLoading, setPtLoading] = useState(false);

  // Sub-resource forms
  const [newSlabForm, setNewSlabForm] = useState({ floor_name: '', floor_order: 1, area_sqft: '', concreting_status: 'scheduled', stressing_status: 'pending', grouting_status: 'pending', remarks: '' });
  const [newDrawingForm, setNewDrawingForm] = useState({ drawing_type: 'as_built', level_name: '', submission_status: 'to_do', submission_date: '', approval_date: '', remarks: '' });
  const [newSupervisorForm, setNewSupervisorForm] = useState({ supervisor_name: '', assigned_role: 'site_supervisor', contact_phone: '' });
  const [commercialForm, setCommercialForm] = useState({ claimed_slabs_text: '', claimed_amount: 0, certified_amount: 0, received_amount: 0, pdc_amount: 0, overdue_amount: 0, billing_status: 'up_to_date', remarks: '' });

  const openPtDetails = async (prj) => {
    setPtLoading(true);
    setPtModalOpen(true);
    setPtActiveTab('slabs');
    try {
      const data = await getProjectDetails(prj.id);
      setPtDetails(data);
      if (data.commercials) {
        setCommercialForm({
          claimed_slabs_text: data.commercials.claimed_slabs_text || '',
          claimed_amount: data.commercials.claimed_amount || 0,
          certified_amount: data.commercials.certified_amount || 0,
          received_amount: data.commercials.received_amount || 0,
          pdc_amount: data.commercials.pdc_amount || 0,
          overdue_amount: data.commercials.overdue_amount || 0,
          billing_status: data.commercials.billing_status || 'up_to_date',
          remarks: data.commercials.remarks || '',
        });
      } else {
        setCommercialForm({ claimed_slabs_text: '', claimed_amount: 0, certified_amount: 0, received_amount: 0, pdc_amount: 0, overdue_amount: 0, billing_status: 'up_to_date', remarks: '' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load project PT details' });
    } finally {
      setPtLoading(false);
    }
  };

  const handleAddSlab = async (e) => {
    e.preventDefault();
    if (!ptDetails?.id) return;
    try {
      const added = await saveProjectSlab(ptDetails.id, newSlabForm);
      setPtDetails(prev => ({ ...prev, slabs: [...prev.slabs, added] }));
      setNewSlabForm({ floor_name: '', floor_order: (ptDetails.slabs?.length || 0) + 1, area_sqft: '', concreting_status: 'scheduled', stressing_status: 'pending', grouting_status: 'pending', remarks: '' });
    } catch (err) {
      alert('Failed to add slab');
    }
  };

  const handleDeleteSlab = async (slabId) => {
    if (!window.confirm('Delete this slab record?')) return;
    try {
      await deleteProjectSlab(ptDetails.id, slabId);
      setPtDetails(prev => ({ ...prev, slabs: prev.slabs.filter(s => s.id !== slabId) }));
    } catch (err) {
      alert('Failed to delete slab');
    }
  };

  const handleAddDrawing = async (e) => {
    e.preventDefault();
    if (!ptDetails?.id) return;
    try {
      const added = await createProjectDrawing(ptDetails.id, newDrawingForm);
      setPtDetails(prev => ({ ...prev, drawings: [added, ...prev.drawings] }));
      setNewDrawingForm({ drawing_type: 'as_built', level_name: '', submission_status: 'to_do', submission_date: '', approval_date: '', remarks: '' });
    } catch (err) {
      alert('Failed to add drawing');
    }
  };

  const handleDeleteDrawing = async (drawingId) => {
    if (!window.confirm('Delete this drawing record?')) return;
    try {
      await deleteProjectDrawing(ptDetails.id, drawingId);
      setPtDetails(prev => ({ ...prev, drawings: prev.drawings.filter(d => d.id !== drawingId) }));
    } catch (err) {
      alert('Failed to delete drawing');
    }
  };

  const handleAddSupervisor = async (e) => {
    e.preventDefault();
    if (!ptDetails?.id) return;
    try {
      const added = await addProjectSupervisor(ptDetails.id, newSupervisorForm);
      setPtDetails(prev => ({ ...prev, supervisors: [...prev.supervisors, added] }));
      setNewSupervisorForm({ supervisor_name: '', assigned_role: 'site_supervisor', contact_phone: '' });
    } catch (err) {
      alert('Failed to assign supervisor');
    }
  };

  const handleDeleteSupervisor = async (supId) => {
    if (!window.confirm('Remove supervisor assignment?')) return;
    try {
      await deleteProjectSupervisor(ptDetails.id, supId);
      setPtDetails(prev => ({ ...prev, supervisors: prev.supervisors.filter(s => s.id !== supId) }));
    } catch (err) {
      alert('Failed to remove supervisor');
    }
  };

  const handleSaveCommercials = async (e) => {
    e.preventDefault();
    if (!ptDetails?.id) return;
    try {
      const updated = await saveProjectCommercials(ptDetails.id, commercialForm);
      setPtDetails(prev => ({ ...prev, commercials: updated }));
      setAlert({ type: 'success', message: 'Commercial & billing metrics updated.' });
    } catch (err) {
      alert('Failed to save commercials');
    }
  };


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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openPtDetails(prj)}>📊 PT Details</button>
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

      {/* PT Master Details Modal */}
      <Modal
        isOpen={ptModalOpen}
        onClose={() => setPtModalOpen(false)}
        title={ptDetails ? `📊 PT Details: ${ptDetails.project_name}` : 'Project PT Details'}
        subtitle={ptDetails ? `Folder: ${ptDetails.folder_no || 'N/A'} | AK Job: ${ptDetails.ak_job_no || 'N/A'} | Scope: ${ptDetails.slab_scope_description || 'PT Slab'}` : ''}
        icon="🏗"
        size="xl"
      >
        {ptLoading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : !ptDetails ? (
          <p>No project data available.</p>
        ) : (
          <div>
            {/* Tabs Header */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--color-border)', marginBottom: 16 }}>
              <button
                className={`btn btn-sm ${ptActiveTab === 'slabs' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '6px 6px 0 0' }}
                onClick={() => setPtActiveTab('slabs')}
              >
                🏗️ Floor Slabs ({ptDetails.slabs?.length || 0})
              </button>
              <button
                className={`btn btn-sm ${ptActiveTab === 'drawings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '6px 6px 0 0' }}
                onClick={() => setPtActiveTab('drawings')}
              >
                📐 Drawings ({ptDetails.drawings?.length || 0})
              </button>
              <button
                className={`btn btn-sm ${ptActiveTab === 'supervisors' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '6px 6px 0 0' }}
                onClick={() => setPtActiveTab('supervisors')}
              >
                👷 Supervisors ({ptDetails.supervisors?.length || 0})
              </button>
              <button
                className={`btn btn-sm ${ptActiveTab === 'commercials' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '6px 6px 0 0' }}
                onClick={() => setPtActiveTab('commercials')}
              >
                💰 Commercial & Billing
              </button>
            </div>

            {/* TAB 1: Slabs Matrix */}
            {ptActiveTab === 'slabs' && (
              <div>
                <form onSubmit={handleAddSlab} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, background: 'var(--color-bg)', padding: 12, borderRadius: 8 }}>
                  <input className="form-control" style={{ flex: '1 1 120px' }} placeholder="Floor (e.g. GF, L1)" value={newSlabForm.floor_name} onChange={e => setNewSlabForm(f => ({ ...f, floor_name: e.target.value }))} required />
                  <input type="number" className="form-control" style={{ flex: '0 0 90px' }} placeholder="Order #" value={newSlabForm.floor_order} onChange={e => setNewSlabForm(f => ({ ...f, floor_order: e.target.value }))} required />
                  <input type="number" className="form-control" style={{ flex: '1 1 100px' }} placeholder="Area sqft" value={newSlabForm.area_sqft} onChange={e => setNewSlabForm(f => ({ ...f, area_sqft: e.target.value }))} />
                  <select className="form-control" style={{ flex: '1 1 120px' }} value={newSlabForm.concreting_status} onChange={e => setNewSlabForm(f => ({ ...f, concreting_status: e.target.value }))}>
                    <option value="scheduled">Concrete: Scheduled</option>
                    <option value="in_progress">Concrete: In Progress</option>
                    <option value="done">Concrete: Done</option>
                  </select>
                  <select className="form-control" style={{ flex: '1 1 120px' }} value={newSlabForm.stressing_status} onChange={e => setNewSlabForm(f => ({ ...f, stressing_status: e.target.value }))}>
                    <option value="pending">Stressing: Pending</option>
                    <option value="in_progress">Stressing: In Progress</option>
                    <option value="completed">Stressing: Completed</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm">+ Add Floor</button>
                </form>

                <div className="table-container" style={{ maxHeight: 350, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Floor</th>
                        <th>Area (sqft)</th>
                        <th>Concreting</th>
                        <th>Stressing</th>
                        <th>Grouting</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ptDetails.slabs || []).length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No floor slab milestones recorded yet.</td></tr>
                      ) : (
                        ptDetails.slabs.map(slab => (
                          <tr key={slab.id}>
                            <td><strong>{slab.floor_name}</strong> (Order #{slab.floor_order})</td>
                            <td>{slab.area_sqft ? Number(slab.area_sqft).toLocaleString() : '—'}</td>
                            <td><span className={`badge ${slab.concreting_status === 'done' ? 'badge-present' : 'badge-half-day'}`}>{slab.concreting_status}</span></td>
                            <td><span className={`badge ${slab.stressing_status === 'completed' ? 'badge-present' : 'badge-half-day'}`}>{slab.stressing_status}</span></td>
                            <td><span className={`badge ${slab.grouting_status === 'completed' ? 'badge-present' : 'badge-warning'}`}>{slab.grouting_status}</span></td>
                            <td style={{ fontSize: '0.85rem' }}>{slab.remarks || '—'}</td>
                            <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteSlab(slab.id)}>🗑</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Drawings */}
            {ptActiveTab === 'drawings' && (
              <div>
                <form onSubmit={handleAddDrawing} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, background: 'var(--color-bg)', padding: 12, borderRadius: 8 }}>
                  <input className="form-control" style={{ flex: '1 1 140px' }} placeholder="Level / Description" value={newDrawingForm.level_name} onChange={e => setNewDrawingForm(f => ({ ...f, level_name: e.target.value }))} required />
                  <select className="form-control" style={{ flex: '1 1 120px' }} value={newDrawingForm.drawing_type} onChange={e => setNewDrawingForm(f => ({ ...f, drawing_type: e.target.value }))}>
                    <option value="as_built">As-Built</option>
                    <option value="shop_drawing">Shop Drawing</option>
                    <option value="design_calc">Design Calc</option>
                  </select>
                  <select className="form-control" style={{ flex: '1 1 120px' }} value={newDrawingForm.submission_status} onChange={e => setNewDrawingForm(f => ({ ...f, submission_status: e.target.value }))}>
                    <option value="to_do">To Do</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm">+ Add Drawing</button>
                </form>

                <div className="table-container" style={{ maxHeight: 350, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Level</th>
                        <th>Status</th>
                        <th>Submission Date</th>
                        <th>Approval Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ptDetails.drawings || []).length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No drawing records submitted.</td></tr>
                      ) : (
                        ptDetails.drawings.map(dwg => (
                          <tr key={dwg.id}>
                            <td><span className="badge badge-asset">{dwg.drawing_type}</span></td>
                            <td><strong>{dwg.level_name}</strong></td>
                            <td><span className={`badge ${dwg.submission_status === 'approved' ? 'badge-present' : dwg.submission_status === 'rejected' ? 'badge-absent' : 'badge-half-day'}`}>{dwg.submission_status}</span></td>
                            <td>{dwg.submission_date ? new Date(dwg.submission_date).toLocaleDateString() : '—'}</td>
                            <td>{dwg.approval_date ? new Date(dwg.approval_date).toLocaleDateString() : '—'}</td>
                            <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteDrawing(dwg.id)}>🗑</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Supervisors */}
            {ptActiveTab === 'supervisors' && (
              <div>
                <form onSubmit={handleAddSupervisor} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, background: 'var(--color-bg)', padding: 12, borderRadius: 8 }}>
                  <input className="form-control" style={{ flex: '1 1 160px' }} placeholder="Supervisor Full Name" value={newSupervisorForm.supervisor_name} onChange={e => setNewSupervisorForm(f => ({ ...f, supervisor_name: e.target.value }))} required />
                  <input className="form-control" style={{ flex: '1 1 140px' }} placeholder="Role (e.g. Lead Supervisor)" value={newSupervisorForm.assigned_role} onChange={e => setNewSupervisorForm(f => ({ ...f, assigned_role: e.target.value }))} />
                  <input className="form-control" style={{ flex: '1 1 140px' }} placeholder="Contact Phone" value={newSupervisorForm.contact_phone} onChange={e => setNewSupervisorForm(f => ({ ...f, contact_phone: e.target.value }))} />
                  <button type="submit" className="btn btn-primary btn-sm">+ Assign Supervisor</button>
                </form>

                <div className="table-container" style={{ maxHeight: 350, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Supervisor Name</th>
                        <th>Assigned Role</th>
                        <th>Contact Phone</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ptDetails.supervisors || []).length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No site supervisors assigned yet.</td></tr>
                      ) : (
                        ptDetails.supervisors.map(sup => (
                          <tr key={sup.id}>
                            <td><strong>👤 {sup.supervisor_name}</strong></td>
                            <td>{sup.assigned_role}</td>
                            <td>{sup.contact_phone || '—'}</td>
                            <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteSupervisor(sup.id)}>🗑 Remove</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Commercials */}
            {ptActiveTab === 'commercials' && (
              <form onSubmit={handleSaveCommercials}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Claimed Slabs Description</label>
                    <input className="form-control" placeholder="e.g. upto lvl 7 on 24/01/26" value={commercialForm.claimed_slabs_text} onChange={e => setCommercialForm(f => ({ ...f, claimed_slabs_text: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Claimed Amount (AED)</label>
                    <input type="number" step="any" className="form-control" value={commercialForm.claimed_amount} onChange={e => setCommercialForm(f => ({ ...f, claimed_amount: e.target.value }))} />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Certified Amount (AED)</label>
                    <input type="number" step="any" className="form-control" value={commercialForm.certified_amount} onChange={e => setCommercialForm(f => ({ ...f, certified_amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Received Amount (AED)</label>
                    <input type="number" step="any" className="form-control" value={commercialForm.received_amount} onChange={e => setCommercialForm(f => ({ ...f, received_amount: e.target.value }))} />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">PDC Amount (AED)</label>
                    <input type="number" step="any" className="form-control" value={commercialForm.pdc_amount} onChange={e => setCommercialForm(f => ({ ...f, pdc_amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overdue Amount (AED)</label>
                    <input type="number" step="any" className="form-control" value={commercialForm.overdue_amount} onChange={e => setCommercialForm(f => ({ ...f, overdue_amount: e.target.value }))} />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Billing Status</label>
                    <select className="form-control" value={commercialForm.billing_status} onChange={e => setCommercialForm(f => ({ ...f, billing_status: e.target.value }))}>
                      <option value="up_to_date">Up to Date</option>
                      <option value="claim_pending">Claim Pending</option>
                      <option value="payment_overdue">Payment Overdue</option>
                      <option value="to_update">To Update</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remarks / Follow-up Notes</label>
                    <input className="form-control" value={commercialForm.remarks} onChange={e => setCommercialForm(f => ({ ...f, remarks: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary">💾 Save Commercial Metrics</button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectMaster;

