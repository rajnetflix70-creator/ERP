const fs = require('fs');
const path = require('path');

const hubCode = `import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectDetails,
  saveProjectSlab,
  deleteProjectSlab
} from '../api/projects';
import { useLookup } from '../hooks/useLookup';
import { useFormValidation } from '../hooks/useFormValidation';
import { useToast } from '../contexts/ToastContext';

import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const PROJECT_VALIDATION_RULES = {
  name: { required: true, label: 'Project Name', minLength: 3 },
  code: { required: true, label: 'Project Code', minLength: 2 },
  client: { required: true, label: 'Client Name' },
  location: { required: true, label: 'Project Location' }
};

export default function ProjectHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'directory');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: divisions } = useLookup('divisions');
  const { data: clients } = useLookup('clients');
  const { data: supervisors } = useLookup('supervisors');

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [ptProject, setPtProject] = useState(null);
  const [ptDetails, setPtDetails] = useState({ slabs: [], drawings: [], supervisors: [], commercials: {} });
  const [ptActiveTab, setPtActiveTab] = useState('slabs');
  const [ptLoading, setPtLoading] = useState(false);

  const {
    values: formValues,
    setValues: setFormValues,
    errors: formErrors,
    touched: formTouched,
    handleChange: handleFormChange,
    handleBlur: handleFormBlur,
    validateAll: validateProjectForm,
    resetForm: resetProjectForm
  } = useFormValidation(
    {
      name: '',
      code: '',
      client: '',
      location: '',
      plot_no: '',
      folder_no: '',
      job_division: 'PT Division',
      tender_net_area: '',
      total_slabs_count: '',
      pm_lead: '',
      budget: '',
      status: 'active'
    },
    PROJECT_VALIDATION_RULES
  );

  const [newSlab, setNewSlab] = useState({ floor_name: '', floor_order: 1, area_sqft: '', concreting_status: 'scheduled', stressing_status: 'pending', grouting_status: 'pending' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, statRes] = await Promise.all([
        getProjects(),
        getProjectStats().catch(() => ({ data: null }))
      ]);

      const list = Array.isArray(projRes?.data) ? projRes.data : (Array.isArray(projRes) ? projRes : []);
      setProjects(list);

      if (statRes?.data) {
        setStats(statRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects from database.', 'Database Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.client && p.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.plot_no && p.plot_no.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDivision =
        selectedDivision === 'all' ||
        (p.job_division && p.job_division.toLowerCase() === selectedDivision.toLowerCase());

      const matchStatus =
        selectedStatus === 'all' ||
        (p.status && p.status.toLowerCase() === selectedStatus.toLowerCase());

      return matchSearch && matchDivision && matchStatus;
    });
  }, [projects, searchQuery, selectedDivision, selectedStatus]);

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const { isValid, summaryMessage } = validateProjectForm();

    if (!isValid) {
      toast.warning(summaryMessage || 'Please fill required fields highlighted in red.', 'Validation Failed');
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingProjectId) {
        await updateProject(editingProjectId, formValues);
        toast.success('Project updated successfully!', 'Project Updated');
      } else {
        await createProject(formValues);
        toast.success('Project created successfully!', 'Project Created');
      }
      setIsProjectModalOpen(false);
      resetProjectForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save project.', 'Save Error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenEdit = (project) => {
    setEditingProjectId(project.id);
    setFormValues({
      name: project.name || '',
      code: project.code || '',
      client: project.client || '',
      location: project.location || '',
      plot_no: project.plot_no || '',
      folder_no: project.folder_no || '',
      job_division: project.job_division || 'PT Division',
      tender_net_area: project.tender_net_area || '',
      total_slabs_count: project.total_slabs_count || '',
      pm_lead: project.pm_lead || '',
      budget: project.budget || '',
      status: project.status || 'active'
    });
    setIsProjectModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteProject(deleteTarget.id);
      toast.success(\`Project "\${deleteTarget.name}" deleted successfully.\`, 'Deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project.', 'Delete Error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenPtModal = async (project) => {
    setPtProject(project);
    setPtModalOpen(true);
    setPtLoading(true);
    try {
      const res = await getProjectDetails(project.id);
      setPtDetails(res.data || { slabs: [], drawings: [], supervisors: [], commercials: {} });
    } catch (err) {
      toast.error('Could not load PT master details for this project.', 'Data Error');
    } finally {
      setPtLoading(false);
    }
  };

  const handleAddSlab = async (e) => {
    e.preventDefault();
    if (!newSlab.floor_name) {
      toast.warning('Floor name is required', 'Required Field');
      return;
    }
    try {
      await saveProjectSlab(ptProject.id, newSlab);
      toast.success(\`Slab level \${newSlab.floor_name} saved.\`);
      setNewSlab({ floor_name: '', floor_order: (ptDetails.slabs?.length || 0) + 2, area_sqft: '', concreting_status: 'scheduled', stressing_status: 'pending', grouting_status: 'pending' });
      const res = await getProjectDetails(ptProject.id);
      setPtDetails(res.data);
    } catch (err) {
      toast.error('Failed to save slab milestone.');
    }
  };

  const handleDeleteSlab = async (slabId) => {
    try {
      await deleteProjectSlab(ptProject.id, slabId);
      toast.info('Slab milestone removed.');
      const res = await getProjectDetails(ptProject.id);
      setPtDetails(res.data);
    } catch (err) {
      toast.error('Could not delete slab.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Projects & PT Master Command Hub"
        subtitle="Unified directory for Post-Tensioning floor slabs, engineering drawings, supervisors & certified commercial billings."
        icon="📁"
        tag="Live Database"
        breadcrumbs={['Overview', 'Project Management', 'Projects & PT Hub']}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setEditingProjectId(null);
                resetProjectForm();
                setIsProjectModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <span>＋</span> New PT Project
            </button>
            <button
              onClick={fetchData}
              className="btn btn-secondary"
              title="Refresh Data"
            >
              🔄
            </button>
          </div>
        }
      />

      <div className="grid-4">
        <StatCard
          label="Total PT Projects"
          value={projects.length}
          badgeText="Active UAE"
          color="blue"
          subtext={\`\${projects.filter(p => p.status === 'active').length} currently active\`}
        />
        <StatCard
          label="Floor Slabs Underway"
          value={stats?.total_slabs || projects.reduce((sum, p) => sum + (parseInt(p.total_slabs_count) || 0), 0) || '0'}
          badgeText="Slab Matrix"
          color="emerald"
          subtext="Cast, stressed & grouted"
        />
        <StatCard
          label="Active Divisions"
          value={divisions?.length || 3}
          badgeText="Engineering"
          color="amber"
          subtext="PT, Civil, Slab Systems"
        />
        <StatCard
          label="Total Portfolio Value"
          value={
            stats?.total_budget
              ? \`AED \${(Number(stats.total_budget) / 1e6).toFixed(2)}M\`
              : 'AED 4.25M'
          }
          badgeText="Commercial"
          color="purple"
          subtext="Certified & in-process billings"
        />
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div className="tab-bar tabs-scroll-row" style={{ borderBottom: 'none', margin: 0 }}>
            <button
              onClick={() => handleTabChange('directory')}
              className={\`tab-item \${activeTab === 'directory' ? 'active' : ''}\`}
            >
              <span>📋</span> Projects Directory ({filteredProjects.length})
            </button>
            <button
              onClick={() => handleTabChange('boq')}
              className={\`tab-item \${activeTab === 'boq' ? 'active' : ''}\`}
            >
              <span>📊</span> BOQ & Work Packages
            </button>
            <button
              onClick={() => handleTabChange('commercials')}
              className={\`tab-item \${activeTab === 'commercials' ? 'active' : ''}\`}
            >
              <span>💰</span> Commercial Claims
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search Job #, Plot, Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ width: '220px', height: '36px', fontSize: '0.82rem' }}
            />

            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="form-control"
              style={{ width: '140px', height: '36px', fontSize: '0.82rem' }}
            >
              <option value="all">All Divisions</option>
              {divisions?.map((d) => (
                <option key={d.value || d.id || d} value={d.value || d.id || d}>
                  {d.name || d.value || d}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-control"
              style={{ width: '130px', height: '36px', fontSize: '0.82rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {activeTab === 'directory' && (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Job & Folder</th>
                  <th>Project & Client Name</th>
                  <th>Location / Plot</th>
                  <th>Tender Area</th>
                  <th>Division</th>
                  <th>Status</th>
                  <th style={{ width: '210px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>Loading projects...</td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon="📁"
                        title="No Projects Found"
                        description="Try adjusting your search criteria or add your first PT project."
                        actionLabel="Add PT Project"
                        onAction={() => {
                          setEditingProjectId(null);
                          resetProjectForm();
                          setIsProjectModalOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Job & Folder">
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>
                          {p.code || 'AK-PT-00'}
                        </div>
                        {p.folder_no && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Folder: {p.folder_no}
                          </div>
                        )}
                      </td>

                      <td data-label="Project">
                        <div
                          onClick={() => navigate(\`/projects/\${p.id}\`)}
                          style={{ fontWeight: 600, color: 'var(--navy)', cursor: 'pointer', fontSize: '0.88rem' }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <span>Client: {p.client || 'Direct'}</span>
                          {p.pm_lead && <span> • PM: {p.pm_lead}</span>}
                        </div>
                      </td>

                      <td data-label="Location">
                        <div style={{ fontWeight: 500 }}>{p.location || 'UAE'}</div>
                        {p.plot_no && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Plot: {p.plot_no}</div>
                        )}
                      </td>

                      <td data-label="Area">
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {p.tender_net_area ? \`\${Number(p.tender_net_area).toLocaleString()} m²\` : '—'}
                        </span>
                        {p.total_slabs_count && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {p.total_slabs_count} Slabs
                          </div>
                        )}
                      </td>

                      <td data-label="Division">
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                          {p.job_division || 'PT Division'}
                        </span>
                      </td>

                      <td data-label="Status">
                        <Badge status={p.status || 'active'} dot />
                      </td>

                      <td data-label="Actions" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenPtModal(p)}
                            className="btn btn-sm"
                            style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309', fontWeight: 600 }}
                            title="Floor Slabs, Drawings & PT Details"
                          >
                            <span>📊</span> PT Details
                          </button>
                          <button
                            onClick={() => navigate(\`/projects/\${p.id}\`)}
                            className="btn btn-secondary btn-sm"
                            title="Open Project Details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Project"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#b91c1c' }}
                            title="Delete Project"
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
        )}

        {activeTab === 'boq' && (
          <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                🏗️ Bill of Quantities & Work Packages
              </h4>
              <button
                onClick={() => navigate('/boq')}
                className="btn btn-primary btn-sm"
              >
                Open Advanced BOQ Module →
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Select a project from the directory or use the dedicated work-package manager to configure tendon quantities, ducting meters, and anchorages.
            </p>
          </div>
        )}

        {activeTab === 'commercials' && (
          <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                💰 Certified Billing, Retention & PDC Tracking
              </h4>
              <button
                onClick={() => navigate('/billing/invoices')}
                className="btn btn-primary btn-sm"
              >
                Open Invoices Register →
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Track submitted invoices, consultant certifications, VAT breakdowns and post-dated check milestones across all active projects.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProjectId ? '✏️ Edit Project' : '＋ Create New PT Project'}
        subtitle="All fields marked * are required and validated straight against database constraints."
        size="lg"
      >
        <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Project Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. Downtown Crest Tower"
                className="form-control"
                style={{ borderColor: formErrors.name && formTouched.name ? 'var(--danger)' : undefined }}
              />
              {formErrors.name && formTouched.name && (
                <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px' }}>{formErrors.name}</div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Job / Project Code <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formValues.code}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. AK-2024-041"
                className="form-control"
                style={{ borderColor: formErrors.code && formTouched.code ? 'var(--danger)' : undefined }}
              />
              {formErrors.code && formTouched.code && (
                <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px' }}>{formErrors.code}</div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Client / Developer <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                list="client-options"
                name="client"
                value={formValues.client}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. Emaar Properties"
                className="form-control"
                style={{ borderColor: formErrors.client && formTouched.client ? 'var(--danger)' : undefined }}
              />
              <datalist id="client-options">
                {clients?.map((c, i) => (
                  <option key={i} value={c.name || c} />
                ))}
              </datalist>
              {formErrors.client && formTouched.client && (
                <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px' }}>{formErrors.client}</div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Location <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formValues.location}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. Business Bay, Dubai"
                className="form-control"
                style={{ borderColor: formErrors.location && formTouched.location ? 'var(--danger)' : undefined }}
              />
              {formErrors.location && formTouched.location && (
                <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px' }}>{formErrors.location}</div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Plot Number</label>
              <input
                type="text"
                name="plot_no"
                value={formValues.plot_no}
                onChange={handleFormChange}
                placeholder="e.g. BB-341-90"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Folder No</label>
              <input
                type="text"
                name="folder_no"
                value={formValues.folder_no}
                onChange={handleFormChange}
                placeholder="e.g. #F-088"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Division</label>
              <select
                name="job_division"
                value={formValues.job_division}
                onChange={handleFormChange}
                className="form-control"
              >
                {divisions?.map((d) => (
                  <option key={d.value || d.id || d} value={d.value || d.id || d}>
                    {d.name || d.value || d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">PM Lead</label>
              <input
                list="pm-options"
                name="pm_lead"
                value={formValues.pm_lead}
                onChange={handleFormChange}
                placeholder="e.g. Engr. Tariq"
                className="form-control"
              />
              <datalist id="pm-options">
                {supervisors?.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tender Net Area (m²)</label>
              <input
                type="number"
                name="tender_net_area"
                value={formValues.tender_net_area}
                onChange={handleFormChange}
                placeholder="e.g. 18500"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Total Floor Slabs Count</label>
              <input
                type="number"
                name="total_slabs_count"
                value={formValues.total_slabs_count}
                onChange={handleFormChange}
                placeholder="e.g. 16"
                className="form-control"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalSubmitting}
              className="btn btn-primary"
            >
              {modalSubmitting ? 'Saving...' : (editingProjectId ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={ptModalOpen}
        onClose={() => setPtModalOpen(false)}
        title={ptProject ? \`\${ptProject.name} (\${ptProject.code})\` : 'PT Master Details'}
        subtitle="Floor-by-floor concrete casting, stressing elongation verification, engineering drawings & commercial claims."
        size="xl"
      >
        {ptLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading PT master data from database...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="tab-bar tabs-scroll-row" style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setPtActiveTab('slabs')}
                className={\`tab-item \${ptActiveTab === 'slabs' ? 'active' : ''}\`}
              >
                <span>🏗️</span> Floor Slabs ({ptDetails.slabs?.length || 0})
              </button>
              <button
                onClick={() => setPtActiveTab('drawings')}
                className={\`tab-item \${ptActiveTab === 'drawings' ? 'active' : ''}\`}
              >
                <span>📐</span> Drawings ({ptDetails.drawings?.length || 0})
              </button>
              <button
                onClick={() => setPtActiveTab('supervisors')}
                className={\`tab-item \${ptActiveTab === 'supervisors' ? 'active' : ''}\`}
              >
                <span>👷</span> Supervisors ({ptDetails.supervisors?.length || 0})
              </button>
              <button
                onClick={() => setPtActiveTab('commercials')}
                className={\`tab-item \${ptActiveTab === 'commercials' ? 'active' : ''}\`}
              >
                <span>💰</span> Commercial & Billing
              </button>
            </div>

            {ptActiveTab === 'slabs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <form onSubmit={handleAddSlab} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px', background: 'var(--bg)', borderRadius: '6px' }}>
                  <input
                    type="text"
                    placeholder="Floor (e.g. Level 1, Roof)"
                    value={newSlab.floor_name}
                    onChange={(e) => setNewSlab({ ...newSlab, floor_name: e.target.value })}
                    className="form-control"
                    style={{ flex: 1, minWidth: '130px' }}
                  />
                  <input
                    type="number"
                    placeholder="Area (m²)"
                    value={newSlab.area_sqft}
                    onChange={(e) => setNewSlab({ ...newSlab, area_sqft: e.target.value })}
                    className="form-control"
                    style={{ width: '100px' }}
                  />
                  <select
                    value={newSlab.concreting_status}
                    onChange={(e) => setNewSlab({ ...newSlab, concreting_status: e.target.value })}
                    className="form-control"
                    style={{ width: '150px' }}
                  >
                    <option value="scheduled">Concrete: Scheduled</option>
                    <option value="in_progress">Concrete: In Progress</option>
                    <option value="done">Concrete: Done</option>
                  </select>
                  <select
                    value={newSlab.stressing_status}
                    onChange={(e) => setNewSlab({ ...newSlab, stressing_status: e.target.value })}
                    className="form-control"
                    style={{ width: '140px' }}
                  >
                    <option value="pending">Stress: Pending</option>
                    <option value="in_progress">Stress: In Progress</option>
                    <option value="done">Stress: Done</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm">
                    ＋ Add Slab
                  </button>
                </form>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Level / Floor</th>
                        <th>Area</th>
                        <th>Concreting</th>
                        <th>Stressing</th>
                        <th>Grouting</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ptDetails.slabs?.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            No slabs recorded yet. Add the first floor above.
                          </td>
                        </tr>
                      ) : (
                        ptDetails.slabs?.map((s) => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 600 }}>{s.floor_name}</td>
                            <td style={{ fontFamily: 'monospace' }}>{s.area_sqft ? \`\${s.area_sqft} m²\` : '—'}</td>
                            <td><Badge status={s.concreting_status} size="xs" /></td>
                            <td><Badge status={s.stressing_status} size="xs" /></td>
                            <td><Badge status={s.grouting_status} size="xs" /></td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteSlab(s.id)}
                                className="btn btn-sm"
                                style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={\`Are you sure you want to permanently remove \"\${deleteTarget?.name}\"? All associated slabs, drawings, and assignments will be deleted.\`}
        confirmText="Yes, Delete Project"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '../frontend/src/pages/ProjectHub.jsx'), hubCode);
console.log('ProjectHub.jsx updated successfully!');
`;

fs.writeFileSync('scratch/apply_native_styles.js', hubCode);
