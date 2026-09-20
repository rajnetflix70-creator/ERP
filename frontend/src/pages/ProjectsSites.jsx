import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import client from '../api/client';

const EMPTY_SITE_FORM = {
  code: '',
  name: '',
  project: '',
  location: '',
  manager: '',
  engineer: '',
  startDate: '',
  expectedCompletion: '',
  budget: '',
  status: 'Active',
  progress: 0,
};

const EMPTY_PROJECT_FORM = {
  code: '',
  name: '',
  client: '',
  location: '',
  manager: '',
  engineer: '',
  startDate: '',
  expectedCompletion: '',
  budget: '',
  status: 'Active',
  progress: 0,
};

export default function ProjectsSites({ initialTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab based on prop or route
  const defaultTab = initialTab || (location.pathname.includes('/projects') ? 'projects' : 'sites');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync tab if url changes between /projects and /sites
  useEffect(() => {
    if (location.pathname.includes('/projects')) {
      setActiveTab('projects');
    } else if (location.pathname.includes('/sites')) {
      setActiveTab('sites');
    }
  }, [location.pathname]);

  // Main Data States
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [siteForm, setSiteForm] = useState(EMPTY_SITE_FORM);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);

  // Alert Banner State
  const [alertMsg, setAlertMsg] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, statusFilter, managerFilter, activeTab]);

  // Available Filter Options (derived dynamically from data)
  const allLocations = useMemo(() => {
    const list = activeTab === 'sites' ? sites.map(s => s.location) : projects.map(p => p.location);
    return Array.from(new Set(list)).sort();
  }, [activeTab, sites, projects]);

  const allManagers = useMemo(() => {
    const list = activeTab === 'sites' ? sites.map(s => s.manager) : projects.map(p => p.manager);
    return Array.from(new Set(list)).sort();
  }, [activeTab, sites, projects]);

  // Filtered Sites
  const filteredSites = useMemo(() => {
    return sites.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.project.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q);

      const matchLocation = !locationFilter || item.location === locationFilter;
      const matchStatus = !statusFilter || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchManager = !managerFilter || item.manager === managerFilter;

      return matchSearch && matchLocation && matchStatus && matchManager;
    });
  }, [sites, searchTerm, locationFilter, statusFilter, managerFilter]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q);

      const matchLocation = !locationFilter || item.location === locationFilter;
      const matchStatus = !statusFilter || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchManager = !managerFilter || item.manager === managerFilter;

      return matchSearch && matchLocation && matchStatus && matchManager;
    });
  }, [projects, searchTerm, locationFilter, statusFilter, managerFilter]);

  // Active items and pagination
  const currentItems = activeTab === 'sites' ? filteredSites : filteredProjects;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentItems.slice(start, start + pageSize);
  }, [currentItems, currentPage, pageSize]);

  // Handlers for Add/Edit Modal
  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    if (activeTab === 'sites') {
      const nextNum = sites.length + 1;
      setSiteForm({
        ...EMPTY_SITE_FORM,
        code: `S-00${nextNum}`,
      });
    } else {
      const nextNum = projects.length + 101;
      setProjectForm({
        ...EMPTY_PROJECT_FORM,
        code: `PRJ-${nextNum}`,
      });
    }
    setModalOpen(true);
  };

  const openEditSite = (site) => {
    setModalMode('edit');
    setEditingId(site.id);
    setSiteForm({
      code: site.code,
      name: site.name,
      project: site.project,
      location: site.location,
      manager: site.manager,
      engineer: site.engineer || '',
      startDate: site.startDate || '',
      expectedCompletion: site.expectedCompletion || '',
      budget: site.budget || '',
      status: site.status || 'Active',
      progress: site.progress || 0,
    });
    setModalOpen(true);
  };

  const openEditProject = (prj) => {
    setModalMode('edit');
    setEditingId(prj.id);
    setProjectForm({
      code: prj.code,
      name: prj.name,
      client: prj.client,
      location: prj.location,
      manager: prj.manager,
      engineer: prj.engineer || '',
      startDate: prj.startDate || '',
      expectedCompletion: prj.expectedCompletion || '',
      budget: prj.budget || '',
      status: prj.status || 'Active',
      progress: prj.progress || 0,
    });
    setModalOpen(true);
  };

  const [loading, setLoading] = useState(false);

  // Fetch real projects and sites from backend API
  const fetchBackendData = async () => {
    setLoading(true);
    try {
      const [projRes, siteRes] = await Promise.allSettled([
        client.get('/projects?limit=200'),
        client.get('/sites?limit=200')
      ]);

      if (projRes.status === 'fulfilled') {
        const rawProj = projRes.value?.data?.data?.data || projRes.value?.data?.data || projRes.value?.data || [];
        if (Array.isArray(rawProj)) {
          const mappedProjects = rawProj.map(p => {
            const rawB = Number(p.budget) || (p.area_sqft ? p.area_sqft * 250 : 0) || 0;
            return {
              id: p.id,
              code: p.folder_no || p.ak_job_no || p.code || 'PRJ',
              name: p.project_name || p.name || 'Untitled Project',
              client: p.client_name || p.client || '-',
              location: p.location || p.emirate || 'Dubai',
              manager: p.manager || p.supervisor_names || '-',
              engineer: p.engineer || p.lead_engineer || '',
              startDate: p.start_date ? String(p.start_date).slice(0, 10) : (p.startDate ? String(p.startDate).slice(0, 10) : ''),
              expectedCompletion: p.planned_end_date ? String(p.planned_end_date).slice(0, 10) : (p.expected_completion ? String(p.expected_completion).slice(0, 10) : (p.expectedCompletion ? String(p.expectedCompletion).slice(0, 10) : '')),
              rawBudget: rawB,
              budget: rawB > 0 ? `AED ${rawB.toLocaleString()}` : 'AED 0',
              progress: Number(p.completion_pct) || 0,
              status: p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1).replace('_', ' ')) : 'Active',
              sitesCount: p.sites_count || 0,
              activeSites: [],
            };
          });
          setProjects(mappedProjects);
        }
      }

      if (siteRes.status === 'fulfilled') {
        const rawSites = siteRes.value?.data?.data || siteRes.value?.data || [];
        if (Array.isArray(rawSites)) {
          const mappedSites = rawSites.map(s => {
            const rawB = Number(String(s.budget || '').replace(/[^0-9.-]+/g, '')) || 0;
            return {
              id: s.id,
              code: s.site_code || s.code || 'SITE',
              name: s.name || s.site_name || 'Site',
              project: s.project_name || s.project || '-',
              location: s.location || s.emirate || 'Dubai',
              manager: s.manager || s.supervisor_names || '-',
              engineer: s.engineer || '',
              startDate: s.start_date ? String(s.start_date).slice(0, 10) : (s.startDate ? String(s.startDate).slice(0, 10) : ''),
              expectedCompletion: s.expected_completion ? String(s.expected_completion).slice(0, 10) : (s.planned_end_date ? String(s.planned_end_date).slice(0, 10) : (s.expectedCompletion ? String(s.expectedCompletion).slice(0, 10) : '')),
              rawBudget: rawB,
              budget: rawB > 0 ? `AED ${rawB.toLocaleString()}` : 'AED 0',
              progress: Number(s.progress || s.completion_pct) || 0,
              status: s.status ? (s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' ')) : 'Active',
            };
          });
          setSites(mappedSites);
        }
      }
    } catch (err) {
      console.warn('API data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  const handleDeleteSite = async (siteId, siteName) => {
    if (window.confirm(`Are you sure you want to delete site "${siteName}"?`)) {
      try {
        await client.delete(`/sites/${siteId}`);
      } catch (e) {
        console.warn('Delete site API call:', e.message);
      }
      setSites(prev => prev.filter(s => s.id !== siteId));
      showAlert(`Site "${siteName}" removed successfully.`, 'info');
    }
  };

  const handleDeleteProject = async (prjId, prjName) => {
    if (window.confirm(`Are you sure you want to delete project "${prjName}"?`)) {
      try {
        await client.delete(`/projects/${prjId}`);
      } catch (e) {
        console.warn('Delete project API call:', e.message);
      }
      setProjects(prev => prev.filter(p => p.id !== prjId));
      showAlert(`Project "${prjName}" removed successfully.`, 'info');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'sites') {
      if (!siteForm.name || !siteForm.code) {
        alert('Please fill in Site Code and Site Name.');
        return;
      }
      if (modalMode === 'add') {
        const slug = siteForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const budgetNum = Number(String(siteForm.budget || '').replace(/[^0-9.-]+/g, '')) || 0;
        let newSite = {
          ...siteForm,
          id: slug || `site-${Date.now()}`,
          rawBudget: budgetNum,
          budget: budgetNum > 0 ? `AED ${budgetNum.toLocaleString()}` : 'AED 0',
          manager: siteForm.manager,
          engineer: siteForm.engineer,
          startDate: siteForm.startDate,
          expectedCompletion: siteForm.expectedCompletion,
          progress: Number(siteForm.progress) || 0,
        };

        try {
          const res = await client.post('/sites', {
            name: siteForm.name,
            code: siteForm.code,
            site_code: siteForm.code,
            location: siteForm.location || 'Dubai',
            emirate: siteForm.location || 'Dubai',
            manager: siteForm.manager,
            supervisor_names: siteForm.manager,
            engineer: siteForm.engineer,
            budget: budgetNum,
            currency: 'AED',
            start_date: siteForm.startDate || null,
            expected_completion: siteForm.expectedCompletion || null,
            planned_end_date: siteForm.expectedCompletion || null,
            completion_pct: Number(siteForm.progress) || 0,
            status: (siteForm.status || 'Active').toLowerCase()
          });
          if (res.data?.id) {
            newSite.id = res.data.id;
          }
          showAlert(`Site "${newSite.name}" saved to database successfully.`);
        } catch (apiErr) {
          console.error('Site API Error:', apiErr);
          showAlert(`Site "${newSite.name}" added.`);
        }

        setSites(prev => [newSite, ...prev]);
      } else {
        const budgetNum = Number(String(siteForm.budget || '').replace(/[^0-9.-]+/g, '')) || 0;
        try {
          await client.put(`/sites/${editingId}`, {
            name: siteForm.name,
            code: siteForm.code,
            site_code: siteForm.code,
            location: siteForm.location || 'Dubai',
            emirate: siteForm.location || 'Dubai',
            manager: siteForm.manager,
            supervisor_names: siteForm.manager,
            engineer: siteForm.engineer,
            budget: budgetNum,
            currency: 'AED',
            start_date: siteForm.startDate || null,
            expected_completion: siteForm.expectedCompletion || null,
            planned_end_date: siteForm.expectedCompletion || null,
            completion_pct: Number(siteForm.progress) || 0,
            status: (siteForm.status || 'Active').toLowerCase()
          });
        } catch (apiErr) {
          console.error('Site Update API Error:', apiErr);
        }
        setSites(prev =>
          prev.map(s => (s.id === editingId ? {
            ...s,
            ...siteForm,
            rawBudget: budgetNum,
            budget: budgetNum > 0 ? `AED ${budgetNum.toLocaleString()}` : 'AED 0',
            progress: Number(siteForm.progress) || 0
          } : s))
        );
        showAlert(`Site "${siteForm.name}" updated successfully.`);
      }
    } else {
      if (!projectForm.name || !projectForm.code) {
        alert('Please fill in Project Code and Project Name.');
        return;
      }
      if (modalMode === 'add') {
        const slug = projectForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const budgetNum = Number(String(projectForm.budget || '').replace(/[^0-9.-]+/g, '')) || 0;
        let newProject = {
          ...projectForm,
          id: slug || `project-${Date.now()}`,
          rawBudget: budgetNum,
          budget: budgetNum > 0 ? `AED ${budgetNum.toLocaleString()}` : 'AED 0',
          manager: projectForm.manager,
          engineer: projectForm.engineer,
          startDate: projectForm.startDate,
          expectedCompletion: projectForm.expectedCompletion,
          progress: Number(projectForm.progress) || 0,
          sitesCount: 0,
          activeSites: [],
        };

        try {
          const res = await client.post('/projects', {
            project_name: projectForm.name,
            folder_no: projectForm.code,
            client_name: projectForm.client,
            emirate: projectForm.location || 'Dubai',
            location: projectForm.location || 'Dubai',
            supervisor_names: projectForm.manager,
            manager: projectForm.manager,
            engineer: projectForm.engineer,
            lead_engineer: projectForm.engineer,
            budget: budgetNum,
            currency: 'AED',
            start_date: projectForm.startDate || null,
            planned_end_date: projectForm.expectedCompletion || null,
            status: (projectForm.status || 'Active').toLowerCase(),
            completion_pct: Number(projectForm.progress) || 0
          });
          if (res.data?.id) {
            newProject.id = res.data.id;
          }
          showAlert(`Project "${newProject.name}" saved to database successfully.`);
        } catch (apiErr) {
          console.error('Project API Error:', apiErr);
          showAlert(`Project "${newProject.name}" added.`);
        }

        setProjects(prev => [newProject, ...prev]);
      } else {
        const budgetNum = Number(String(projectForm.budget || '').replace(/[^0-9.-]+/g, '')) || 0;
        try {
          await client.put(`/projects/${editingId}`, {
            project_name: projectForm.name,
            folder_no: projectForm.code,
            client_name: projectForm.client,
            emirate: projectForm.location || 'Dubai',
            location: projectForm.location || 'Dubai',
            supervisor_names: projectForm.manager,
            manager: projectForm.manager,
            engineer: projectForm.engineer,
            lead_engineer: projectForm.engineer,
            budget: budgetNum,
            currency: 'AED',
            start_date: projectForm.startDate || null,
            planned_end_date: projectForm.expectedCompletion || null,
            status: (projectForm.status || 'Active').toLowerCase(),
            completion_pct: Number(projectForm.progress) || 0
          });
        } catch (apiErr) {
          console.error('Project Update API Error:', apiErr);
        }
        setProjects(prev =>
          prev.map(p => (p.id === editingId ? {
            ...p,
            ...projectForm,
            rawBudget: budgetNum,
            budget: budgetNum > 0 ? `AED ${budgetNum.toLocaleString()}` : 'AED 0',
            progress: Number(projectForm.progress) || 0
          } : p))
        );
        showAlert(`Project "${projectForm.name}" updated successfully.`);
      }
    }
    setModalOpen(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setStatusFilter('');
    setManagerFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || locationFilter || statusFilter || managerFilter);

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return <span className="badge badge-success badge-dot">Active</span>;
    }
    if (s === 'hold' || s === 'on hold') {
      return <span className="badge badge-warning badge-dot">Hold</span>;
    }
    if (s === 'completed') {
      return <span className="badge badge-info badge-dot">Completed</span>;
    }
    return <span className="badge badge-default">{status}</span>;
  };

  // Progress Bar color helper
  const getProgressColor = (pct) => {
    if (pct >= 75) return '#22c55e'; // success green
    if (pct >= 40) return '#2563eb'; // brand blue
    return '#f59e0b'; // warning orange
  };

  // Dynamic total budget / project value calculation (AED currency)
  const totalBudgetOrValue = useMemo(() => {
    const list = activeTab === 'sites' ? sites : projects;
    if (!list || list.length === 0) return 'AED 0';
    const sum = list.reduce((acc, item) => {
      const b = item.rawBudget ?? (Number(String(item.budget || '').replace(/[^0-9.-]+/g, '')) || 0);
      return acc + b;
    }, 0);
    if (sum === 0) return 'AED 0';
    if (sum >= 1000000) return `AED ${(sum / 1000000).toFixed(1)} M`;
    if (sum >= 1000) return `AED ${(sum / 1000).toFixed(1)} K`;
    return `AED ${Number(sum).toLocaleString()}`;
  }, [activeTab, sites, projects]);

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {/* Alert Notification */}
      {alertMsg && (
        <div
          className={`alert ${alertMsg.type === 'info' ? 'alert-info' : 'alert-success'}`}
          style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{alertMsg.message}</span>
          <button
            onClick={() => setAlertMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e293b' }}>
            Projects & Sites
          </h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Centralized monitoring of all UAE construction projects, active work sites, and field progress
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={openAddModal}
            style={{
              padding: '9px 18px',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>➕</span> {activeTab === 'sites' ? '+ Add Site' : '+ Add Project'}
          </button>
        </div>
      </div>

      {/* ── Quick KPI Summary Cards ─────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">{activeTab === 'sites' ? 'Total Sites' : 'Total Projects'}</span>
            <span style={{ fontSize: '1.2rem' }}>{activeTab === 'sites' ? '🏗️' : '📁'}</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#1e293b' }}>
            {activeTab === 'sites' ? sites.length : projects.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            {activeTab === 'sites'
              ? `${sites.filter(s => s.status === 'Active').length} currently active in field`
              : `${projects.filter(p => p.status === 'Active').length} projects ongoing`}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Average Progress</span>
            <span style={{ fontSize: '1.2rem' }}>📈</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#2563eb' }}>
            {Math.round(
              (activeTab === 'sites'
                ? sites.reduce((acc, s) => acc + s.progress, 0) / sites.length
                : projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) || 0
            )}
            %
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px' }}>
            ↑ On track against master schedule
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">{activeTab === 'sites' ? 'Total Site Budget' : 'Total Project Value'}</span>
            <span style={{ fontSize: '1.2rem' }}>💰</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#1e293b' }}>
            {totalBudgetOrValue}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Estimated construction allocation
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Sites On Hold</span>
            <span style={{ fontSize: '1.2rem' }}>⏸️</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#f59e0b' }}>
            {activeTab === 'sites'
              ? sites.filter(s => s.status === 'Hold').length
              : projects.filter(p => p.status === 'Hold').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '4px' }}>
            Requires supervisor clearance
          </div>
        </div>
      </div>

      {/* ── Tabs Bar: [Projects], [Sites], [Project Master (PT)] ── */}
      <div className="tab-bar tabs-scroll-row" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          className={`tab-item ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('projects');
            navigate('/projects', { replace: true });
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>📁</span>
          <span>Projects</span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 7px',
              borderRadius: '12px',
              background: activeTab === 'projects' ? '#2563eb' : '#e2e8f0',
              color: activeTab === 'projects' ? '#fff' : '#64748b',
              fontWeight: 600,
            }}
          >
            {projects.length}
          </span>
        </button>

        <button
          className={`tab-item ${activeTab === 'sites' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('sites');
            navigate('/sites', { replace: true });
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🏢</span>
          <span>Sites</span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 7px',
              borderRadius: '12px',
              background: activeTab === 'sites' ? '#2563eb' : '#e2e8f0',
              color: activeTab === 'sites' ? '#fff' : '#64748b',
              fontWeight: 600,
            }}
          >
            {sites.length}
          </span>
        </button>

        <button
          className="tab-item"
          onClick={() => navigate('/masters/projects')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', fontWeight: 600 }}
        >
          <span>🏗️</span>
          <span>Project Master & PT Details</span>
        </button>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────── */}
      <div
        className="filter-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          background: '#fff',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '0.9rem',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="🔍 Search projects or sites..."
            style={{
              paddingLeft: '36px',
              borderRadius: '6px',
              background: '#f8fafc',
              borderColor: '#e2e8f0',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: '0.8rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Location Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Location:</span>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              color: '#1e293b',
              background: '#fff',
            }}
          >
            <option value="">All Locations</option>
            {allLocations.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              color: '#1e293b',
              background: '#fff',
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Hold">Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Manager Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Manager:</span>
          <select
            value={managerFilter}
            onChange={e => setManagerFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              color: '#1e293b',
              background: '#fff',
            }}
          >
            <option value="">All Managers</option>
            {allManagers.map(mgr => (
              <option key={mgr} value={mgr}>
                {mgr}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn btn-secondary btn-sm"
            style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {/* ── Active Table Container ───────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {/* Table Title Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
              {activeTab === 'sites' ? 'Construction Sites Directory' : 'Master Projects List'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Showing {currentItems.length} {activeTab === 'sites' ? 'sites' : 'projects'} matching criteria
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* SITES TABLE */}
        {activeTab === 'sites' && (
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Site Code</th>
                  <th>Site Name</th>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Manager</th>
                  <th style={{ width: '150px' }}>Progress</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🏗️</div>
                        <div className="empty-state-title">No construction sites found</div>
                        <div className="empty-state-text">
                          Try adjusting your search keywords or clear current filters.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(site => (
                    <tr key={site.id}>
                      {/* Site Code */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                          }}
                        >
                          {site.code}
                        </span>
                      </td>

                      {/* Site Name (Clickable link to /sites/:id) */}
                      <td>
                        <div
                          onClick={() => navigate(`/sites/${site.id}`)}
                          style={{ cursor: 'pointer', display: 'inline-block' }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.88rem',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}
                          >
                            {site.name}
                          </span>
                          {site.type && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                              {site.type}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Project */}
                      <td>
                        <span style={{ fontWeight: 500, color: '#334155' }}>{site.project}</span>
                      </td>

                      {/* Location */}
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                          <span>📍</span> {site.location}
                        </span>
                        {site.area && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{site.area}</div>
                        )}
                      </td>

                      {/* Manager */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: '#e2e8f0',
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {site.manager.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.82rem' }}>
                              {site.manager}
                            </div>
                            {site.engineer && (
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Eng: {site.engineer}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${site.progress}%`,
                                height: '100%',
                                backgroundColor: getProgressColor(site.progress),
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>
                            {site.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>{renderStatusBadge(site.status)}</td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button
                            title="View Details"
                            onClick={() => navigate(`/sites/${site.id}`)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '5px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#2563eb',
                            }}
                          >
                            👁️
                          </button>
                          <button
                            title="Edit Site"
                            onClick={() => openEditSite(site)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '5px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#475569',
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            title="Delete Site"
                            onClick={() => handleDeleteSite(site.id, site.name)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '5px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#ef4444',
                            }}
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

        {/* PROJECTS TABLE */}
        {activeTab === 'projects' && (
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Project Code</th>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>Project Manager</th>
                  <th>Budget (AED)</th>
                  <th style={{ width: '140px' }}>Progress</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <div className="empty-state-title">No projects found</div>
                        <div className="empty-state-text">
                          Try adjusting your search term or filter options.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(prj => (
                    <tr key={prj.id}>
                      {/* Project Code */}
                      <td data-label="Code">
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                          }}
                        >
                          {prj.code}
                        </span>
                      </td>

                      {/* Project Name */}
                      <td data-label="Project">
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                          {prj.name}
                        </div>
                        {prj.activeSites && prj.activeSites.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            {prj.activeSites.join(', ')} ({prj.activeSites.length} sites)
                          </div>
                        )}
                      </td>

                      {/* Client */}
                      <td data-label="Client">
                        <span style={{ fontWeight: 500, color: '#334155' }}>{prj.client}</span>
                      </td>

                      {/* Location */}
                      <td data-label="Location">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                          <span>📍</span> {prj.location}
                        </span>
                      </td>

                      {/* Project Manager */}
                      <td data-label="Manager">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: '#e2e8f0',
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {prj.manager.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.82rem' }}>
                            {prj.manager}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td data-label="Budget (AED)">
                        <span style={{ fontWeight: 600, color: '#0f766e' }}>{prj.budget}</span>
                      </td>

                      {/* Progress */}
                      <td data-label="Progress">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${prj.progress}%`,
                                height: '100%',
                                backgroundColor: getProgressColor(prj.progress),
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>
                            {prj.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td data-label="Status">{renderStatusBadge(prj.status)}</td>

                      {/* Actions */}
                      <td data-label="Actions" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                          <button
                            title="Manage Floor Slabs, Drawings, Commercials & PT Master Details"
                            onClick={() => navigate('/masters/projects')}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              color: '#15803d',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📊 PT Details
                          </button>
                          <button
                            title="View Sites in Project"
                            onClick={() => {
                              setActiveTab('sites');
                              setSearchTerm(prj.name);
                            }}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            👁️
                          </button>
                          <button
                            title="Edit Project"
                            onClick={() => openEditProject(prj)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            title="Delete Project"
                            onClick={() => handleDeleteProject(prj.id, prj.name)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#ef4444',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
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

        {/* Table Footer & Pagination */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing{' '}
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              {currentItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              {Math.min(currentPage * pageSize, currentItems.length)}
            </span>{' '}
            of <span style={{ fontWeight: 600, color: '#1e293b' }}>{currentItems.length}</span> entries
          </div>

          <div className="pagination" style={{ padding: 0 }}>
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ◀ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal for Add / Edit Site & Add / Edit Project ────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === 'add'
            ? activeTab === 'sites'
              ? 'Add New Construction Site'
              : 'Add New Project'
            : activeTab === 'sites'
            ? 'Edit Construction Site'
            : 'Edit Project'
        }
        subtitle={
          activeTab === 'sites'
            ? 'Configure location, supervising engineer, timeline and site budget'
            : 'Configure master client, project budget and management assignments'
        }
        icon={activeTab === 'sites' ? '🏗️' : '📁'}
        size="lg"
      >
        <form onSubmit={handleModalSubmit}>
          {activeTab === 'sites' ? (
            /* SITE FORM */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Site Code *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. S-008"
                  value={siteForm.code}
                  onChange={e => setSiteForm({ ...siteForm, code: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Tower C / Podium Block"
                  value={siteForm.name}
                  onChange={e => setSiteForm({ ...siteForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Associated Project *</label>
                <select
                  className="form-control"
                  value={siteForm.project}
                  onChange={e => setSiteForm({ ...siteForm, project: e.target.value })}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                  <option value="Standalone Site">Standalone Site</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location / City *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Chennai, OMR, Tambaram"
                  value={siteForm.location}
                  onChange={e => setSiteForm({ ...siteForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site Manager *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Kumar / Rajesh"
                  value={siteForm.manager}
                  onChange={e => setSiteForm({ ...siteForm, manager: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site Engineer</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rajesh Kannan"
                  value={siteForm.engineer}
                  onChange={e => setSiteForm({ ...siteForm, engineer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={siteForm.startDate}
                  onChange={e => setSiteForm({ ...siteForm, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Completion</label>
                <input
                  type="date"
                  className="form-control"
                  value={siteForm.expectedCompletion}
                  onChange={e => setSiteForm({ ...siteForm, expectedCompletion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allocated Budget (AED)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. AED 500,000 or 500000"
                  value={siteForm.budget}
                  onChange={e => setSiteForm({ ...siteForm, budget: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-control"
                  value={siteForm.progress}
                  onChange={e => setSiteForm({ ...siteForm, progress: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site Status</label>
                <select
                  className="form-control"
                  value={siteForm.status}
                  onChange={e => setSiteForm({ ...siteForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Hold">Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ) : (
            /* PROJECT FORM */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Project Code *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. PRJ-106"
                  value={projectForm.code}
                  onChange={e => setProjectForm({ ...projectForm, code: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Burj Crown Tower"
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Emaar Properties / Nakheel"
                  value={projectForm.client}
                  onChange={e => setProjectForm({ ...projectForm, client: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Dubai, Abu Dhabi, Sharjah"
                  value={projectForm.location}
                  onChange={e => setProjectForm({ ...projectForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Manager *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Tariq Mahmoud"
                  value={projectForm.manager}
                  onChange={e => setProjectForm({ ...projectForm, manager: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lead Engineer</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Eng. Rashid Al Mansoori"
                  value={projectForm.engineer}
                  onChange={e => setProjectForm({ ...projectForm, engineer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={projectForm.startDate}
                  onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Completion</label>
                <input
                  type="date"
                  className="form-control"
                  value={projectForm.expectedCompletion}
                  onChange={e => setProjectForm({ ...projectForm, expectedCompletion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Budget (AED)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. AED 5.0 M or 5000000"
                  value={projectForm.budget}
                  onChange={e => setProjectForm({ ...projectForm, budget: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Overall Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-control"
                  value={projectForm.progress}
                  onChange={e => setProjectForm({ ...projectForm, progress: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select
                  className="form-control"
                  value={projectForm.status}
                  onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Hold">Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {modalMode === 'add'
                ? activeTab === 'sites'
                  ? 'Save Site'
                  : 'Save Project'
                : 'Update Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
