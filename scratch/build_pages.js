const fs = require('fs');
const path = require('path');

// 1. Create ProjectHub.jsx
const projectHubCode = `import React, { useState, useEffect, useMemo } from 'react';
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
import { SkeletonCards, SkeletonRow } from '../components/SkeletonLoader';

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
    <div className="space-y-6 select-none">
      <PageHeader
        title="Projects & PT Master Command Hub"
        subtitle="Unified directory for Post-Tensioning floor slabs, engineering drawings, supervisors & certified commercial billings."
        icon="📁"
        tag="Live Database"
        breadcrumbs={['Overview', 'Project Management', 'Projects & PT Hub']}
        actions={
          <>
            <button
              onClick={() => {
                setEditingProjectId(null);
                resetProjectForm();
                setIsProjectModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <span>＋</span> New PT Project
            </button>
            <button
              onClick={fetchData}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-3 rounded-xl transition"
              title="Refresh Data"
            >
              🔄
            </button>
          </>
        }
      />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => handleTabChange('directory')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }\`}
            >
              <span>📋</span> Projects Directory ({filteredProjects.length})
            </button>
            <button
              onClick={() => handleTabChange('boq')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
                activeTab === 'boq'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }\`}
            >
              <span>📊</span> BOQ & Work Packages
            </button>
            <button
              onClick={() => handleTabChange('commercials')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
                activeTab === 'commercials'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }\`}
            >
              <span>💰</span> Commercial Claims
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search Job #, Plot, Client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
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
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
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
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Job & Folder</th>
                  <th className="py-3.5 px-4">Project & Client Name</th>
                  <th className="py-3.5 px-4">Location / Plot</th>
                  <th className="py-3.5 px-4">Tender Area</th>
                  <th className="py-3.5 px-4">Division</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
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
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-400 text-sm">
                          {p.code || 'AK-PT-00'}
                        </div>
                        {p.folder_no && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Folder: {p.folder_no}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div
                          onClick={() => navigate(\`/projects/\${p.id}\`)}
                          className="font-bold text-white text-sm hover:text-blue-400 cursor-pointer transition"
                        >
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>Client: {p.client || 'Direct'}</span>
                          {p.pm_lead && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">PM: {p.pm_lead}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{p.location || 'UAE'}</div>
                        {p.plot_no && (
                          <div className="text-[10px] text-slate-500">Plot: {p.plot_no}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-200">
                          {p.tender_net_area ? \`\${Number(p.tender_net_area).toLocaleString()} m²\` : '—'}
                        </span>
                        {p.total_slabs_count && (
                          <div className="text-[10px] text-slate-500">
                            {p.total_slabs_count} Slabs
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700">
                          {p.job_division || 'PT Division'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge status={p.status || 'active'} dot />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenPtModal(p)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow flex items-center gap-1 transition"
                            title="Floor Slabs, Drawings & PT Details"
                          >
                            <span>📊</span> PT Details
                          </button>
                          <button
                            onClick={() => navigate(\`/projects/\${p.id}\`)}
                            className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-[11px] px-2 py-1.5 rounded-lg transition"
                            title="Open Project Hub Details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] px-2 py-1.5 rounded-lg transition"
                            title="Edit Project"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 text-[11px] px-2 py-1.5 rounded-lg transition"
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
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-wide">
                🏗️ Bill of Quantities & Material Take-off by Project
              </h4>
              <button
                onClick={() => navigate('/boq')}
                className="text-xs text-blue-400 hover:underline font-semibold"
              >
                Open Advanced BOQ Module →
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Select a project from the directory or use the dedicated work-package manager to configure tendon quantities, ducting meters, anchorages and stressing specs.
            </p>
          </div>
        )}

        {activeTab === 'commercials' && (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-wide">
                💰 Certified Billing, Retention & PDC Tracking
              </h4>
              <button
                onClick={() => navigate('/billing/invoices')}
                className="text-xs text-blue-400 hover:underline font-semibold"
              >
                Open Invoices Register →
              </button>
            </div>
            <p className="text-xs text-slate-400">
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
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. Downtown Crest Tower"
                className={\`w-full bg-slate-950 border text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition \${
                  formErrors.name && formTouched.name
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }\`}
              />
              {formErrors.name && formTouched.name && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Job / Project Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formValues.code}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. AK-2024-041"
                className={\`w-full bg-slate-950 border text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition \${
                  formErrors.code && formTouched.code
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }\`}
              />
              {formErrors.code && formTouched.code && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Client / Developer <span className="text-rose-400">*</span>
              </label>
              <input
                list="client-options"
                name="client"
                value={formValues.client}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. Emaar Properties"
                className={\`w-full bg-slate-950 border text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition \${
                  formErrors.client && formTouched.client
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }\`}
              />
              <datalist id="client-options">
                {clients?.map((c, i) => (
                  <option key={i} value={c.name || c} />
                ))}
              </datalist>
              {formErrors.client && formTouched.client && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.client}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Location <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formValues.location}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                placeholder="e.g. Business Bay, Dubai"
                className={\`w-full bg-slate-950 border text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition \${
                  formErrors.location && formTouched.location
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }\`}
              />
              {formErrors.location && formTouched.location && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Plot Number</label>
              <input
                type="text"
                name="plot_no"
                value={formValues.plot_no}
                onChange={handleFormChange}
                placeholder="e.g. BB-341-90"
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Folder No</label>
              <input
                type="text"
                name="folder_no"
                value={formValues.folder_no}
                onChange={handleFormChange}
                placeholder="e.g. #F-088"
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Division</label>
              <select
                name="job_division"
                value={formValues.job_division}
                onChange={handleFormChange}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                {divisions?.map((d) => (
                  <option key={d.value || d.id || d} value={d.value || d.id || d}>
                    {d.name || d.value || d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">PM Lead</label>
              <input
                list="pm-options"
                name="pm_lead"
                value={formValues.pm_lead}
                onChange={handleFormChange}
                placeholder="e.g. Engr. Tariq"
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              />
              <datalist id="pm-options">
                {supervisors?.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="btn btn-secondary text-xs px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalSubmitting}
              className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
            >
              {modalSubmitting && <span className="animate-spin text-xs">⏳</span>}
              {editingProjectId ? 'Save Changes' : 'Create Project'}
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
          <div className="py-12 text-center text-xs text-slate-400">
            Loading PT master data from database...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setPtActiveTab('slabs')}
                className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                  ptActiveTab === 'slabs' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>🏗️</span> Floor Slabs ({ptDetails.slabs?.length || 0})
              </button>
              <button
                onClick={() => setPtActiveTab('drawings')}
                className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                  ptActiveTab === 'drawings' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>📐</span> Drawings ({ptDetails.drawings?.length || 0})
              </button>
              <button
                onClick={() => setPtActiveTab('supervisors')}
                className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                  ptActiveTab === 'supervisors' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>👷</span> Supervisors ({ptDetails.supervisors?.length || 0})
              </button>
              <button
                onClick={() => setPtActiveTab('commercials')}
                className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                  ptActiveTab === 'commercials' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>💰</span> Commercial & Billing
              </button>
            </div>

            {ptActiveTab === 'slabs' && (
              <div className="space-y-4">
                <form onSubmit={handleAddSlab} className="flex items-center gap-2 flex-wrap bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Floor (e.g. Level 1, Roof)"
                    value={newSlab.floor_name}
                    onChange={(e) => setNewSlab({ ...newSlab, floor_name: e.target.value })}
                    className="flex-1 min-w-[140px] bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Area (m²)"
                    value={newSlab.area_sqft}
                    onChange={(e) => setNewSlab({ ...newSlab, area_sqft: e.target.value })}
                    className="w-24 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                  />
                  <select
                    value={newSlab.concreting_status}
                    onChange={(e) => setNewSlab({ ...newSlab, concreting_status: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-2"
                  >
                    <option value="scheduled">Concrete: Scheduled</option>
                    <option value="in_progress">Concrete: In Progress</option>
                    <option value="done">Concrete: Done</option>
                  </select>
                  <select
                    value={newSlab.stressing_status}
                    onChange={(e) => setNewSlab({ ...newSlab, stressing_status: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-2"
                  >
                    <option value="pending">Stress: Pending</option>
                    <option value="in_progress">Stress: In Progress</option>
                    <option value="done">Stress: Done</option>
                  </select>
                  <button type="submit" className="btn btn-primary text-xs px-3 py-2">
                    ＋ Add Slab
                  </button>
                </form>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Level / Floor</th>
                        <th className="py-2.5 px-3">Area</th>
                        <th className="py-2.5 px-3">Concreting</th>
                        <th className="py-2.5 px-3">Stressing</th>
                        <th className="py-2.5 px-3">Grouting</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {ptDetails.slabs?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-500">
                            No slabs recorded yet. Add the first floor above.
                          </td>
                        </tr>
                      ) : (
                        ptDetails.slabs?.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-bold text-white">{s.floor_name}</td>
                            <td className="py-2 px-3 font-mono">{s.area_sqft ? \`\${s.area_sqft} m²\` : '—'}</td>
                            <td className="py-2 px-3"><Badge status={s.concreting_status} size="xs" /></td>
                            <td className="py-2 px-3"><Badge status={s.stressing_status} size="xs" /></td>
                            <td className="py-2 px-3"><Badge status={s.grouting_status} size="xs" /></td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleDeleteSlab(s.id)}
                                className="text-rose-400 hover:text-rose-300 text-xs"
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

            {ptActiveTab === 'drawings' && (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Drawing #</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Revision</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {ptDetails.drawings?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500">
                          No drawings submitted yet for this project.
                        </td>
                      </tr>
                    ) : (
                      ptDetails.drawings?.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono text-blue-400 font-bold">{d.drawing_no}</td>
                          <td className="py-2 px-3 text-white">{d.drawing_title}</td>
                          <td className="py-2 px-3 font-mono">{d.revision_no}</td>
                          <td className="py-2 px-3">{d.submission_stage}</td>
                          <td className="py-2 px-3"><Badge status={d.approval_status} size="xs" /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {ptActiveTab === 'supervisors' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ptDetails.supervisors?.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-slate-500">
                    No site supervisors assigned yet.
                  </div>
                ) : (
                  ptDetails.supervisors?.map((sup) => (
                    <div key={sup.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-xs">{sup.supervisor_name}</p>
                        <p className="text-[11px] text-slate-400">{sup.role_type || 'Site Supervisor'} • {sup.contact_phone || 'No phone'}</p>
                      </div>
                      <span className="text-emerald-400 text-xs font-semibold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Active
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {ptActiveTab === 'commercials' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h5 className="font-bold text-xs text-slate-200">Commercial & Financial Summary</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Contract Total</p>
                    <p className="text-base font-bold text-white font-mono mt-1">
                      AED {ptDetails.commercials?.contract_amount ? Number(ptDetails.commercials.contract_amount).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Total Claimed</p>
                    <p className="text-base font-bold text-blue-400 font-mono mt-1">
                      AED {ptDetails.commercials?.claimed_amount ? Number(ptDetails.commercials.claimed_amount).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Certified</p>
                    <p className="text-base font-bold text-emerald-400 font-mono mt-1">
                      AED {ptDetails.commercials?.certified_amount ? Number(ptDetails.commercials.certified_amount).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Received</p>
                    <p className="text-base font-bold text-purple-400 font-mono mt-1">
                      AED {ptDetails.commercials?.received_amount ? Number(ptDetails.commercials.received_amount).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={\`Are you sure you want to permanently remove "\${deleteTarget?.name}"? All associated slabs, drawings, and assignments will be deleted.\`}
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

// 2. Create ProjectDetail.jsx
const projectDetailCode = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectDetails, saveProjectSlab, deleteProjectSlab } from '../api/projects';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slabs');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getProjectDetails(id);
      setProject(res.data);
    } catch (err) {
      toast.error('Could not load project details from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading Project Command Hub...
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="⚠️"
        title="Project Not Found"
        description="The requested project does not exist in the database."
        actionLabel="Back to Projects Hub"
        onAction={() => navigate('/projects')}
      />
    );
  }

  const slabs = project.slabs || [];
  const drawings = project.drawings || [];
  const supervisors = project.supervisors || [];
  const commercials = project.commercials || {};

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title={project.name}
        subtitle={\`Job Code: \${project.code || 'AK-PT'} • Client: \${project.client || 'Direct'} • Location: \${project.location || 'UAE'}\`}
        icon="🏗️"
        tag={project.status?.toUpperCase() || 'ACTIVE'}
        breadcrumbs={['Overview', 'Projects & PT Hub', project.name]}
        actions={
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-secondary text-xs px-3.5 py-2"
          >
            ← Back to Directory
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tender Net Area"
          value={project.tender_net_area ? \`\${Number(project.tender_net_area).toLocaleString()} m²\` : '—'}
          badgeText="Specifications"
          color="blue"
        />
        <StatCard
          label="Floor Slabs Count"
          value={slabs.length}
          badgeText="Total Levels"
          color="emerald"
        />
        <StatCard
          label="Engineering Drawings"
          value={drawings.length}
          badgeText="As-Builts"
          color="amber"
        />
        <StatCard
          label="Contract Budget"
          value={commercials.contract_amount ? \`AED \${Number(commercials.contract_amount).toLocaleString()}\` : '—'}
          badgeText="Commercial"
          color="purple"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('slabs')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
              activeTab === 'slabs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }\`}
          >
            <span>🏗️</span> Floor Slabs ({slabs.length})
          </button>
          <button
            onClick={() => setActiveTab('drawings')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
              activeTab === 'drawings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }\`}
          >
            <span>📐</span> Drawings & As-Builts ({drawings.length})
          </button>
          <button
            onClick={() => setActiveTab('supervisors')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
              activeTab === 'supervisors' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }\`}
          >
            <span>👷</span> Assigned Supervisors ({supervisors.length})
          </button>
          <button
            onClick={() => setActiveTab('commercials')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 \${
              activeTab === 'commercials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }\`}
          >
            <span>💰</span> Commercial & Billing
          </button>
        </div>

        {activeTab === 'slabs' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Level / Floor</th>
                  <th className="py-3 px-4">Tender Area</th>
                  <th className="py-3 px-4">Concreting</th>
                  <th className="py-3 px-4">Stressing</th>
                  <th className="py-3 px-4">Grouting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {slabs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No floor slabs recorded yet for this project.
                    </td>
                  </tr>
                ) : (
                  slabs.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{s.floor_name}</td>
                      <td className="py-3 px-4 font-mono">{s.area_sqft ? \`\${s.area_sqft} m²\` : '—'}</td>
                      <td className="py-3 px-4"><Badge status={s.concreting_status} /></td>
                      <td className="py-3 px-4"><Badge status={s.stressing_status} /></td>
                      <td className="py-3 px-4"><Badge status={s.grouting_status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'drawings' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Drawing #</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drawings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No engineering drawings registered yet.
                    </td>
                  </tr>
                ) : (
                  drawings.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-blue-400 font-bold">{d.drawing_no}</td>
                      <td className="py-3 px-4 text-white font-medium">{d.drawing_title}</td>
                      <td className="py-3 px-4 font-mono">{d.revision_no}</td>
                      <td className="py-3 px-4">{d.submission_stage}</td>
                      <td className="py-3 px-4"><Badge status={d.approval_status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'supervisors' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {supervisors.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-500">
                No site supervisors assigned yet.
              </div>
            ) : (
              supervisors.map((sup) => (
                <div key={sup.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{sup.supervisor_name}</p>
                    <p className="text-xs text-slate-400">{sup.role_type || 'Site Supervisor'} • {sup.contact_phone || 'No phone'}</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-semibold bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                    Active on Site
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'commercials' && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
            <h5 className="font-bold text-xs text-slate-200">Commercial & Financial Summary</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Contract Total</p>
                <p className="text-lg font-bold text-white font-mono mt-1">
                  AED {commercials.contract_amount ? Number(commercials.contract_amount).toLocaleString() : '—'}
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Total Claimed</p>
                <p className="text-lg font-bold text-blue-400 font-mono mt-1">
                  AED {commercials.claimed_amount ? Number(commercials.claimed_amount).toLocaleString() : '0'}
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Certified</p>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  AED {commercials.certified_amount ? Number(commercials.certified_amount).toLocaleString() : '0'}
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Received</p>
                <p className="text-lg font-bold text-purple-400 font-mono mt-1">
                  AED {commercials.received_amount ? Number(commercials.received_amount).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '../frontend/src/pages/ProjectHub.jsx'), projectHubCode);
fs.writeFileSync(path.join(__dirname, '../frontend/src/pages/ProjectDetail.jsx'), projectDetailCode);

console.log('ProjectHub.jsx and ProjectDetail.jsx generated successfully!');
