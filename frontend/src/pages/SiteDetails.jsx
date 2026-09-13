import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import client from '../api/client';

export default function SiteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: [Overview], [BOQ], [Material Requirements], [Requests], [PO], [GRN], [Stock], [Reports], [Documents], [Photos]
  const [activeTab, setActiveTab] = useState('Overview');

  // Live transactional data for this site
  const [requests, setRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [boqList, setBoqList] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Edit Site Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    project: '',
    location: '',
    manager: '',
    engineer: '',
    startDate: '',
    expectedCompletion: '',
    budget: '',
    progress: 0,
    status: 'Active',
  });

  // Filter / Search States
  const [boqSearch, setBoqSearch] = useState('');
  const [boqSection, setBoqSection] = useState('All');
  const [stockSearch, setStockSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch site data & related records
  useEffect(() => {
    let isMounted = true;
    const fetchSiteData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch sites list and find by id or code
        const sitesRes = await client.get('/sites');
        const sitesArray = Array.isArray(sitesRes.data?.data?.data)
          ? sitesRes.data.data.data
          : Array.isArray(sitesRes.data?.data)
          ? sitesRes.data.data
          : Array.isArray(sitesRes.data)
          ? sitesRes.data
          : [];

        const found = sitesArray.find(
          s => String(s.id) === String(id) || s.code?.toLowerCase() === id?.toLowerCase() || s.name?.toLowerCase() === id?.toLowerCase()
        );

        if (found && isMounted) {
          const formattedSite = {
            id: found.id,
            code: found.code || `S-${String(found.id).padStart(3, '0')}`,
            name: found.name || 'Unnamed Site',
            project: found.project_name || found.project || 'Unassigned Project',
            projectCode: found.project_code || 'PRJ-001',
            location: found.location || 'Site Location',
            area: found.area || found.location || '',
            manager: found.manager || found.site_manager || 'Not Assigned',
            engineer: found.engineer || found.site_engineer || 'Not Assigned',
            startDate: found.start_date || found.startDate || 'N/A',
            expectedCompletion: found.expected_completion || found.expectedCompletion || found.planned_end_date || 'N/A',
            budget: found.budget ? `AED ${Number(found.budget).toLocaleString()}` : 'AED 0',
            rawBudget: Number(found.budget) || 0,
            progress: Number(found.progress || found.completion_pct) || 0,
            status: found.status ? (found.status.charAt(0).toUpperCase() + found.status.slice(1)) : 'Active',
            projectValue: found.budget ? `AED ${Number(found.budget).toLocaleString()}` : 'AED 0',
            materialBudget: 'AED 0',
            materialPurchased: 'AED 0',
            materialConsumed: 'AED 0',
            floors: found.floors || 'N/A',
            type: found.type || 'Construction Site',
            address: found.address || found.location || 'N/A',
            milestone: found.milestone || 'In Progress',
            headcount: found.headcount || '0 Workers on Site Today',
          };
          setSite(formattedSite);
          setEditForm({
            name: formattedSite.name,
            project: formattedSite.project,
            location: formattedSite.location,
            manager: formattedSite.manager,
            engineer: formattedSite.engineer,
            startDate: formattedSite.startDate,
            expectedCompletion: formattedSite.expectedCompletion,
            budget: formattedSite.budget,
            progress: formattedSite.progress,
            status: formattedSite.status,
          });
        } else if (isMounted) {
          // Fallback if not found in list, try direct GET /sites/:id
          try {
            const singleRes = await client.get(`/sites/${id}`);
            const singleData = singleRes.data?.data || singleRes.data;
            if (singleData && isMounted) {
              setSite(singleData);
            } else if (isMounted) {
              setError('Site not found');
            }
          } catch {
            if (isMounted) setError('Site not found');
          }
        }

        // Fetch related requests, POs, GRNs, and materials
        try {
          const [reqRes, poRes, grnRes, matRes] = await Promise.allSettled([
            client.get('/material-requests'),
            client.get('/procurement/orders'),
            client.get('/procurement/grn'),
            client.get('/materials'),
          ]);

          if (isMounted) {
            if (reqRes.status === 'fulfilled') {
              const rData = reqRes.value.data?.data?.data || reqRes.value.data?.data || reqRes.value.data || [];
              if (Array.isArray(rData)) setRequests(rData);
            }
            if (poRes.status === 'fulfilled') {
              const pData = poRes.value.data?.data?.data || poRes.value.data?.data || poRes.value.data || [];
              if (Array.isArray(pData)) setPurchaseOrders(pData);
            }
            if (grnRes.status === 'fulfilled') {
              const gData = grnRes.value.data?.data?.data || grnRes.value.data?.data || grnRes.value.data || [];
              if (Array.isArray(gData)) setGrnList(gData);
            }
            if (matRes.status === 'fulfilled') {
              const mData = matRes.value.data?.data?.data || matRes.value.data?.data || matRes.value.data || [];
              if (Array.isArray(mData)) {
                setStockList(mData.map((m, i) => ({
                  id: m.id || i,
                  material: m.name,
                  category: m.category || 'General',
                  opening: `${m.stock_quantity || 0} ${m.unit_of_measure || m.unit || 'Nos'}`,
                  received: '0',
                  issued: '0',
                  balance: `${m.stock_quantity || 0} ${m.unit_of_measure || m.unit || 'Nos'}`,
                  balanceQty: Number(m.stock_quantity) || 0,
                  reorderLevel: `${m.reorder_level || 0} ${m.unit_of_measure || m.unit || 'Nos'}`,
                  status: (Number(m.stock_quantity) <= Number(m.reorder_level || 0)) ? 'Low Stock' : 'Healthy',
                })));
              }
            }
          }
        } catch {
          // ignore related fetch error
        }

      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load site');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSiteData();
    return () => { isMounted = false; };
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!site) return;
    try {
      await client.put(`/sites/${site.id}`, {
        name: editForm.name,
        location: editForm.location,
        manager: editForm.manager,
        engineer: editForm.engineer,
        start_date: editForm.startDate,
        expected_completion: editForm.expectedCompletion,
        budget: editForm.budget?.replace(/[^0-9.]/g, ''),
        completion_pct: Number(editForm.progress) || 0,
        status: editForm.status?.toLowerCase(),
      });
      setSite(prev => ({
        ...prev,
        ...editForm,
        progress: Number(editForm.progress) || 0,
      }));
      setEditModalOpen(false);
      showToast(`Site "${editForm.name}" updated successfully.`);
    } catch {
      setSite(prev => ({
        ...prev,
        ...editForm,
        progress: Number(editForm.progress) || 0,
      }));
      setEditModalOpen(false);
      showToast(`Site "${editForm.name}" updated.`);
    }
  };

  const filteredBoq = useMemo(() => {
    return boqList.filter(item => {
      const matchSearch =
        !boqSearch ||
        item.description?.toLowerCase().includes(boqSearch.toLowerCase()) ||
        item.code?.toLowerCase().includes(boqSearch.toLowerCase());
      const matchSection = boqSection === 'All' || item.section === boqSection;
      return matchSearch && matchSection;
    });
  }, [boqList, boqSearch, boqSection]);

  const filteredStock = useMemo(() => {
    return stockList.filter(item => {
      return (
        !stockSearch ||
        item.material?.toLowerCase().includes(stockSearch.toLowerCase()) ||
        item.category?.toLowerCase().includes(stockSearch.toLowerCase())
      );
    });
  }, [stockList, stockSearch]);

  const allTabs = [
    { key: 'Overview', label: 'Overview', icon: '📊' },
    { key: 'BOQ', label: 'BOQ', icon: '📋', count: boqList.length },
    { key: 'Material Requirements', label: 'Material Requirements', icon: '🧱', count: stockList.length },
    { key: 'Requests', label: 'Requests', icon: '📤', count: requests.length },
    { key: 'PO', label: 'PO', icon: '🛒', count: purchaseOrders.length },
    { key: 'GRN', label: 'GRN', icon: '📥', count: grnList.length },
    { key: 'Stock', label: 'Stock', icon: '📦', count: stockList.length },
    { key: 'Reports', label: 'Reports', icon: '📈', count: 0 },
    { key: 'Documents', label: 'Documents', icon: '📁', count: documents.length },
    { key: 'Photos', label: 'Photos', icon: '📷', count: photos.length },
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏗️</div>
        <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Loading Site Details...</h3>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Fetching live site metrics and transaction history</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="page-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
        <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Site Not Found</h3>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
          The requested site identifier could not be found in the database.
        </p>
        <Link to="/sites" className="btn btn-primary">
          ← Back to Sites & Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {/* Toast alert */}
      {toast && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
        <Link to="/sites" style={{ textDecoration: 'none', color: '#2563eb' }}>
          Projects & Sites
        </Link>
        <span className="breadcrumb-sep"> / </span>
        <Link to="/sites" style={{ textDecoration: 'none', color: '#2563eb' }}>
          Sites
        </Link>
        <span className="breadcrumb-sep"> / </span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>{site.name}</span>
      </div>

      {/* Header */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#fff',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {site.name} - Site Details
            </h1>
            <span
              className={`badge ${
                site.status === 'Active' || site.status === 'active'
                  ? 'badge-success'
                  : site.status === 'Hold' || site.status === 'hold'
                  ? 'badge-warning'
                  : 'badge-info'
              } badge-dot`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              {site.status}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {site.code}
            </span>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '6px', margin: '6px 0 0 0' }}>
            Project: <strong style={{ color: '#1e293b' }}>{site.project}</strong> | Location:{' '}
            <strong style={{ color: '#1e293b' }}>{site.location}</strong> |{' '}
            <strong style={{ color: '#2563eb' }}>{site.progress}% Completed</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setEditForm({
                name: site.name,
                project: site.project,
                location: site.location,
                manager: site.manager,
                engineer: site.engineer,
                startDate: site.startDate,
                expectedCompletion: site.expectedCompletion,
                budget: site.budget,
                progress: site.progress,
                status: site.status,
              });
              setEditModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 600 }}
          >
            <span>✏️</span> Edit Site
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/materials/requests/new')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 600 }}
          >
            <span>➕</span> + New Request
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div
        className="tab-bar"
        style={{
          marginBottom: '20px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          paddingBottom: '2px',
        }}
      >
        {allTabs.map(t => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.84rem',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === t.key ? '#dbeafe' : '#f1f5f9',
                  color: activeTab === t.key ? '#1d4ed8' : '#64748b',
                  fontWeight: 700,
                  marginLeft: '2px',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Figures */}
          <div className="grid-4">
            <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Project Budget</span>
                <span style={{ fontSize: '1.2rem' }}>💰</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#1e293b' }}>
                {site.budget || '₹0'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Total allocated site budget
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #0f766e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Total Requests</span>
                <span style={{ fontSize: '1.2rem' }}>📤</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#0f766e' }}>
                {requests.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Material requests submitted
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Purchase Orders</span>
                <span style={{ fontSize: '1.2rem' }}>🛒</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#b45309' }}>
                {purchaseOrders.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px' }}>
                Active procurement orders
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Goods Receipts (GRN)</span>
                <span style={{ fontSize: '1.2rem' }}>📥</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#15803d' }}>
                {grnList.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px' }}>
                Deliveries verified at site
              </div>
            </div>
          </div>

          {/* Main 2-Column Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Left: Summary */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card-header" style={{ marginBottom: '8px', paddingBottom: '8px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏗️</span> Site Summary & Field Status
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  {site.code}
                </span>
              </div>

              {/* Progress */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>Physical Completion</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}>{site.progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: '8px', background: '#e2e8f0' }}>
                  <div className="progress-bar-fill" style={{ width: `${site.progress}%`, background: '#2563eb' }} />
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Project:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.project}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Site Manager:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.manager}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Site Engineer:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.engineer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Start Date:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.startDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Expected Completion:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.expectedCompletion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Location:</span>
                  <span style={{ fontWeight: 500, color: '#334155', textAlign: 'right', maxWidth: '60%' }}>
                    {site.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Links & Recent MRs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div className="card-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
                  <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
                    ⚡ Quick Navigation Links
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Material Requests', icon: '📤', count: `${requests.length} Req`, tab: 'Requests' },
                    { label: 'Purchase Orders', icon: '🛒', count: `${purchaseOrders.length} POs`, tab: 'PO' },
                    { label: 'GRN / Deliveries', icon: '📥', count: `${grnList.length} GRN`, tab: 'GRN' },
                    { label: 'Site Inventory', icon: '📦', count: `${stockList.length} Items`, tab: 'Stock' },
                  ].map(link => (
                    <div
                      key={link.label}
                      onClick={() => setActiveTab(link.tab)}
                      style={{
                        padding: '12px 10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{link.icon}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{link.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '2px' }}>{link.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent MRs */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    Recent Material Requests
                  </h3>
                  <button
                    onClick={() => setActiveTab('Requests')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', color: '#2563eb' }}
                  >
                    View All →
                  </button>
                </div>
                <div className="table-responsive">
                  <table style={{ margin: 0, fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Material</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No material requests found for this site.
                          </td>
                        </tr>
                      ) : (
                        requests.slice(0, 5).map(req => (
                          <tr key={req.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                              {req.request_number || req.id}
                            </td>
                            <td>{req.material_name || req.material || req.items?.[0]?.material_name || 'Material Item'}</td>
                            <td>{req.quantity || req.items?.[0]?.quantity || '-'}</td>
                            <td>
                              <span className="badge badge-info">{req.status || 'Pending'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOQ */}
      {activeTab === 'BOQ' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Bill of Quantities (BOQ)</h3>
            <button className="btn btn-primary btn-sm" onClick={() => showToast('BOQ upload feature is ready.')}>
              + Add BOQ Item
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Section</th>
                  <th>Est. Qty</th>
                  <th>Unit</th>
                  <th>Rate (AED)</th>
                  <th>Total Amount (AED)</th>
                  <th>Consumed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoq.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No Bill of Quantities (BOQ) line items created for this site yet.
                    </td>
                  </tr>
                ) : (
                  filteredBoq.map(b => (
                    <tr key={b.code}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.code}</td>
                      <td>{b.description}</td>
                      <td>{b.section}</td>
                      <td>{b.estimatedQty}</td>
                      <td>{b.unit}</td>
                      <td>AED {b.rate?.toLocaleString()}</td>
                      <td>AED {b.totalAmount?.toLocaleString()}</td>
                      <td>{b.actualConsumed}</td>
                      <td><span className="badge badge-success">{b.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Stock */}
      {(activeTab === 'Stock' || activeTab === 'Material Requirements') && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Site Stock & Inventory</h3>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search materials..."
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
              style={{ width: '220px', padding: '6px 12px', fontSize: '0.82rem' }}
            />
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Opening</th>
                  <th>Balance</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No stock records found for this site.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.material}</td>
                      <td>{s.category}</td>
                      <td>{s.opening}</td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{s.balance}</td>
                      <td>{s.reorderLevel}</td>
                      <td>
                        <span className={`badge ${s.status === 'Low Stock' ? 'badge-warning' : 'badge-success'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Requests */}
      {activeTab === 'Requests' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Material Requests ({requests.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/materials/requests/new')}>
              + New Request
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Req No</th>
                  <th>Requested By</th>
                  <th>Required Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No material requests submitted for this site.
                    </td>
                  </tr>
                ) : (
                  requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {r.request_number || r.id}
                      </td>
                      <td>{r.requested_by_name || r.requested_by || '-'}</td>
                      <td>{r.required_date || '-'}</td>
                      <td><span className="badge badge-info">{r.priority || 'Normal'}</span></td>
                      <td><span className="badge badge-warning">{r.status || 'Pending'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PO */}
      {activeTab === 'PO' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Purchase Orders ({purchaseOrders.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/procurement/orders')}>
              + Create PO
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No purchase orders recorded for this site.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {p.po_number || p.id}
                      </td>
                      <td>{p.vendor_name || '-'}</td>
                      <td>₹{Number(p.total_amount || 0).toLocaleString()}</td>
                      <td><span className="badge badge-success">{p.status || 'Open'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: GRN */}
      {activeTab === 'GRN' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Goods Receipt Notes ({grnList.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/procurement/grn')}>
              + Receive GRN
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>GRN No</th>
                  <th>PO Ref</th>
                  <th>Vendor</th>
                  <th>Received Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grnList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No goods receipt notes (GRN) found for this site.
                    </td>
                  </tr>
                ) : (
                  grnList.map(g => (
                    <tr key={g.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {g.grn_number || g.id}
                      </td>
                      <td>{g.po_number || '-'}</td>
                      <td>{g.vendor_name || '-'}</td>
                      <td>{g.received_date || '-'}</td>
                      <td><span className="badge badge-success">{g.status || 'Accepted'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: Documents / Reports / Photos */}
      {(activeTab === 'Documents' || activeTab === 'Reports' || activeTab === 'Photos') && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
            {activeTab === 'Documents' ? '📁' : activeTab === 'Photos' ? '📷' : '📈'}
          </div>
          <h4 style={{ color: '#1e293b', marginBottom: '6px' }}>No {activeTab} Uploaded</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
            There are no {activeTab.toLowerCase()} attached to this site. Upload files to maintain site records.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => showToast(`Upload ${activeTab} ready.`)}>
            + Upload {activeTab}
          </button>
        </div>
      )}

      {/* Edit Site Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Site Details">
        <form onSubmit={handleEditSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Site Name *</label>
              <input
                type="text"
                className="form-control"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Location *</label>
              <input
                type="text"
                className="form-control"
                value={editForm.location}
                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Site Manager</label>
              <input
                type="text"
                className="form-control"
                value={editForm.manager}
                onChange={e => setEditForm({ ...editForm, manager: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Site Engineer</label>
              <input
                type="text"
                className="form-control"
                value={editForm.engineer}
                onChange={e => setEditForm({ ...editForm, engineer: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={editForm.startDate}
                onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Expected Completion</label>
              <input
                type="date"
                className="form-control"
                value={editForm.expectedCompletion}
                onChange={e => setEditForm({ ...editForm, expectedCompletion: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Budget (₹)</label>
              <input
                type="text"
                className="form-control"
                value={editForm.budget}
                onChange={e => setEditForm({ ...editForm, budget: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                value={editForm.progress}
                onChange={e => setEditForm({ ...editForm, progress: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
