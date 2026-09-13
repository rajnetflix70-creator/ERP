import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';

const SITE_FILTER_OPTIONS = ['All Sites'];
const PRIORITY_FILTER_OPTIONS = ['All Priorities', 'Urgent', 'High', 'Normal'];
const DATE_FILTER_OPTIONS = ['All Dates', 'Today', 'Last 7 Days', 'This Month'];

const formatAED = (val) => {
  if (!val && val !== 0) return 'AED 0';
  const num = Number(val) || 0;
  return `AED ${num.toLocaleString()}`;
};

const ApprovalCenter = () => {
  // Active Tab: 'mr' (Material Requests) | 'po' (Purchase Orders) | 'grn' (GRN)
  const [activeTab, setActiveTab] = useState('mr');

  // Lists state
  const [materialRequests, setMaterialRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchApprovals = async () => {
      setLoadingData(true);
      try {
        const [mrRes, poRes, grnRes] = await Promise.allSettled([
          client.get('/material-requests?limit=100'),
          client.get('/procurement/orders?limit=100'),
          client.get('/procurement/grn?limit=100')
        ]);

        if (!isMounted) return;

        // 1. Material Requests
        let mappedMR = [];
        if (mrRes.status === 'fulfilled') {
          const raw = mrRes.value?.data?.data?.data || mrRes.value?.data?.data || mrRes.value?.data || [];
          if (Array.isArray(raw)) {
            mappedMR = raw.map(m => ({
              id: m.id,
              request_no: m.mr_number || m.request_number || m.request_no || m.pr_number || `MR-${m.id?.slice(0, 6)}`,
              site: m.site_name || m.site || '-',
              site_full: m.site_name || m.site || '-',
              project_name: m.project_name || '-',
              requested_by: m.requested_by_name || m.requester_name || m.requested_by || 'Staff',
              requested_by_role: m.requested_by_role || 'Site Engineer',
              amount: Number(m.total_amount || m.estimated_cost || m.amount || 0),
              date: m.created_at ? (typeof m.created_at === 'string' && m.created_at.includes('T') ? new Date(m.created_at).toLocaleDateString('en-GB') : m.created_at) : (m.date || '-'),
              date_needed: m.required_date ? (typeof m.required_date === 'string' && m.required_date.includes('-') ? new Date(m.required_date).toLocaleDateString('en-GB') : m.required_date) : '-',
              priority: m.priority ? (m.priority.charAt(0).toUpperCase() + m.priority.slice(1)) : 'Normal',
              status: (m.status || 'pending').toLowerCase().includes('approved') ? 'Approved' : 'Pending Approval',
              purpose: m.purpose || m.remarks || 'Material Request',
              delivery_location: m.delivery_location || '-',
              boq_allowance: 'Standard quota',
              materials: Array.isArray(m.items) ? m.items : [],
              timeline: m.timeline || []
            }));
          }
        }

        const localMR = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');
        const localMappedMR = localMR.map(m => ({
          id: m.id,
          request_no: m.mr_number || m.request_number || m.request_no || `MR-${m.id?.slice(0, 6)}`,
          site: m.site || m.site_name || '-',
          site_full: m.site || m.site_name || '-',
          project_name: m.project_name || '-',
          requested_by: m.requested_by_name || m.requested_by || 'Site Engineer',
          requested_by_role: m.requested_by_role || 'Site Engineer',
          amount: Number(m.amount || m.total_amount || 0),
          date: m.date || (m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB') : '-'),
          date_needed: m.required_date || '-',
          priority: m.priority ? (m.priority.charAt(0).toUpperCase() + m.priority.slice(1)) : 'Normal',
          status: (m.status || 'pending').toLowerCase().includes('approved') ? 'Approved' : 'Pending Approval',
          purpose: m.purpose || m.remarks || 'Material Request',
          delivery_location: m.delivery_location || '-',
          boq_allowance: 'Standard quota',
          materials: Array.isArray(m.items) ? m.items : [],
          timeline: m.timeline || []
        }));

        const existingMRIds = new Set(mappedMR.map(m => String(m.id || m.request_no)));
        const extraLocalMR = localMappedMR.filter(m => !existingMRIds.has(String(m.id || m.request_no)));
        const mergedMR = [...extraLocalMR, ...mappedMR];
        setMaterialRequests(mergedMR);

        // 2. Purchase Orders
        let mappedPO = [];
        if (poRes.status === 'fulfilled') {
          const raw = poRes.value?.data?.data?.data || poRes.value?.data?.data || poRes.value?.data || [];
          if (Array.isArray(raw)) {
            mappedPO = raw.map(p => ({
              id: p.id,
              request_no: p.po_number || `PO-${p.id?.slice(0, 6)}`,
              site: p.site_name || '-',
              site_full: p.site_name || '-',
              project_name: p.project_name || '-',
              vendor_name: p.vendor_name || '-',
              requested_by: p.buyer_name || p.created_by || 'Procurement',
              requested_by_role: 'Purchase Officer',
              amount: Number(p.total_amount || 0),
              date: p.po_date || (p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '-'),
              priority: p.priority || 'Normal',
              status: (p.status || 'draft').toLowerCase().includes('approved') ? 'Approved' : 'Pending Approval',
              purpose: p.notes || 'Purchase Order',
              delivery_location: p.delivery_address || '-',
              boq_allowance: 'PO Contract',
              materials: Array.isArray(p.items) ? p.items : [],
              timeline: p.timeline || []
            }));
          }
        }
        setPurchaseOrders(mappedPO);

        // 3. Goods Receipt Notes (GRN)
        let mappedGRN = [];
        if (grnRes.status === 'fulfilled') {
          const raw = grnRes.value?.data?.data?.data || grnRes.value?.data?.data || grnRes.value?.data || [];
          if (Array.isArray(raw)) {
            mappedGRN = raw.map(g => ({
              id: g.id,
              request_no: g.grn_number || g.grn_no || `GRN-${g.id?.slice(0, 6)}`,
              site: g.site_name || '-',
              site_full: g.site_name || '-',
              project_name: g.project_name || '-',
              vendor_name: g.vendor_name || '-',
              requested_by: g.received_by || 'Store Keeper',
              requested_by_role: 'Store Incharge',
              amount: Number(g.total_amount || 0),
              date: g.received_at || g.date || (g.created_at ? new Date(g.created_at).toLocaleDateString('en-GB') : '-'),
              priority: 'Normal',
              status: (g.status || 'pending').toLowerCase().includes('approved') ? 'Approved' : 'Pending Approval',
              purpose: g.remarks || 'Goods Received Note',
              delivery_location: g.site_name || '-',
              boq_allowance: 'Delivery Inward',
              materials: Array.isArray(g.items) ? g.items : [],
              timeline: g.timeline || []
            }));
          }
        }
        setGrnList(mappedGRN);

      } catch (err) {
        console.warn('Error fetching approvals:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchApprovals();
    return () => { isMounted = false; };
  }, []);

  // Filters
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Drawer / Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [currentReviewItem, setCurrentReviewItem] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Quick chips for review comments
  const QUICK_COMMENTS = [
    'Approved as per verified BOQ quota & daily schedule.',
    'Verified with central store; available stock insufficient, purchase recommended.',
    'Please reduce ordered quantity by 15% to match weekly casting limit.',
    'Material rate verified with procurement contract.',
    'Ensure mill test report and slump test certificate on delivery.',
  ];

  // Counts for tabs
  const mrCount = materialRequests.filter(m => m.status === 'Pending Approval').length;
  const poCount = purchaseOrders.filter(p => p.status === 'Pending Approval').length;
  const grnCount = grnList.filter(g => g.status === 'Pending Approval').length;
  const totalPending = mrCount + poCount + grnCount;

  const totalPendingValue = useMemo(() => {
    const mrVal = materialRequests.filter(m => m.status === 'Pending Approval').reduce((s, i) => s + (i.amount || 0), 0);
    const poVal = purchaseOrders.filter(p => p.status === 'Pending Approval').reduce((s, i) => s + (i.amount || 0), 0);
    const grnVal = grnList.filter(g => g.status === 'Pending Approval').reduce((s, i) => s + (i.amount || 0), 0);
    return mrVal + poVal + grnVal;
  }, [materialRequests, purchaseOrders, grnList]);

  // Current dataset based on active tab
  const currentDataset = useMemo(() => {
    if (activeTab === 'mr') return materialRequests;
    if (activeTab === 'po') return purchaseOrders;
    return grnList;
  }, [activeTab, materialRequests, purchaseOrders, grnList]);

  // Filtered dataset
  const filteredDataset = useMemo(() => {
    return currentDataset.filter(item => {
      // Site filter
      if (siteFilter !== 'All Sites') {
        const siteText = (item.site || '').toLowerCase();
        if (!siteText.includes(siteFilter.toLowerCase())) return false;
      }

      // Priority filter
      if (priorityFilter !== 'All Priorities') {
        if ((item.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = (item.request_no || '').toLowerCase().includes(q);
        const matchSite = (item.site || '').toLowerCase().includes(q);
        const matchReq = (item.requested_by || '').toLowerCase().includes(q);
        const matchPurp = (item.purpose || '').toLowerCase().includes(q);
        const matchVendor = (item.vendor_name || '').toLowerCase().includes(q);
        if (!matchNo && !matchSite && !matchReq && !matchPurp && !matchVendor) return false;
      }

      return true;
    });
  }, [currentDataset, siteFilter, priorityFilter, searchQuery]);

  // Review button click
  const handleOpenReview = (item) => {
    setCurrentReviewItem(item);
    setReviewComments('');
    setActionAlert(null);
    setIsReviewOpen(true);
  };

  // Workflow actions handler
  const handleWorkflowAction = async (actionType) => {
    if (!currentReviewItem) return;

    setActionLoading(true);
    const itemNo = currentReviewItem.request_no;
    let newStatus = 'Pending Approval';
    let alertMsg = '';
    let alertType = 'success';

    if (actionType === 'approve') {
      newStatus = 'Approved';
      alertMsg = `Request ${itemNo} has been APPROVED successfully and routed to Purchase Manager.`;
    } else if (actionType === 'approve_changes') {
      newStatus = 'Approved with Changes';
      alertMsg = `Request ${itemNo} has been APPROVED WITH MODIFICATIONS. Notes logged into audit trail.`;
    } else if (actionType === 'send_back') {
      newStatus = 'Sent Back for Revision';
      alertMsg = `Request ${itemNo} was SENT BACK to ${currentReviewItem.requested_by} for required clarifications.`;
      alertType = 'warning';
    } else if (actionType === 'reject') {
      newStatus = 'Rejected';
      alertMsg = `Request ${itemNo} was REJECTED. Reason recorded in audit log.`;
      alertType = 'danger';
    }

    try {
      // 1. Attempt API update
      try {
        if (activeTab === 'mr') {
          await client.put(`/materials/requests/${currentReviewItem.id}/approve`, {
            status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'reviewed',
            approval_notes: reviewComments || `${actionType} via Approval Center`
          });
        }
      } catch (apiErr) {
        console.warn('API endpoint note:', apiErr.message);
      }

      // 2. Update local state
      const updateTimeline = (item) => {
        const currentTimeline = item.timeline ? [...item.timeline] : [];
        if (currentTimeline.length >= 2) {
          currentTimeline[1] = {
            ...currentTimeline[1],
            status: newStatus,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            note: reviewComments || `Actioned: ${actionType}`
          };
        }
        return {
          ...item,
          status: newStatus,
          review_notes: reviewComments,
          timeline: currentTimeline
        };
      };

      if (activeTab === 'mr') {
        setMaterialRequests(prev => prev.map(m => m.id === currentReviewItem.id ? updateTimeline(m) : m));
      } else if (activeTab === 'po') {
        setPurchaseOrders(prev => prev.map(p => p.id === currentReviewItem.id ? updateTimeline(p) : p));
      } else {
        setGrnList(prev => prev.map(g => g.id === currentReviewItem.id ? updateTimeline(g) : g));
      }

      setActionAlert({ type: alertType, message: alertMsg });

      // Update in stored material requests as well
      try {
        const stored = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');
        const updated = stored.map(s => s.mr_number === itemNo ? { ...s, status: newStatus } : s);
        localStorage.setItem('sitetrack_material_requests', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => {
        setIsReviewOpen(false);
        setActionAlert(null);
      }, 1400);

    } catch (err) {
      console.error(err);
      setActionAlert({ type: 'danger', message: 'Error processing approval. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Badge helpers
  const renderPriorityBadge = (p) => {
    const priority = (p || 'Normal').toLowerCase();
    if (priority === 'urgent') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '4px',
          fontSize: '0.74rem',
          fontWeight: '700',
          background: '#fee2e2',
          color: '#dc2626',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          🔥 Urgent
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '4px',
          fontSize: '0.74rem',
          fontWeight: '600',
          background: '#fef3c7',
          color: '#d97706',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⚡ High
        </span>
      );
    }
    return (
      <span style={{
        padding: '3px 9px',
        borderRadius: '4px',
        fontSize: '0.74rem',
        fontWeight: '500',
        background: '#eff6ff',
        color: '#2563eb'
      }}>
        Normal
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const s = (status || 'Pending Approval').toLowerCase();
    if (s.includes('approved') && !s.includes('changes')) {
      return <span className="badge badge-success badge-dot">Approved</span>;
    }
    if (s.includes('changes')) {
      return <span className="badge badge-info badge-dot">Approved w/ Changes</span>;
    }
    if (s.includes('sent back') || s.includes('revision')) {
      return <span className="badge badge-warning badge-dot">Sent Back</span>;
    }
    if (s.includes('reject')) {
      return <span className="badge badge-danger badge-dot">Rejected</span>;
    }
    return <span className="badge badge-warning badge-dot">Pending Approval</span>;
  };

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {/* ── Top Header ── */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Approval Center</h1>
            <span style={{
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Screen 7
            </span>
          </div>
          <p className="page-subtitle">
            Review and approve pending requests across sites
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Pending Value:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--navy)' }}>
              {formatAED(totalPendingValue)}
            </span>
          </div>

          <Link to="/materials/requests" className="btn btn-secondary">
            View All Requests
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div
          className="stat-card"
          onClick={() => setActiveTab('mr')}
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'mr' ? '4px solid var(--primary)' : '1px solid var(--border)',
            background: activeTab === 'mr' ? 'var(--primary-50)' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--primary)' }}>{mrCount}</div>
              <div className="stat-label">Material Requests</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>
              📦
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            7 site indents pending approval
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab('po')}
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'po' ? '4px solid #8b5cf6' : '1px solid var(--border)',
            background: activeTab === 'po' ? '#f5f3ff' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: '#8b5cf6' }}>{poCount}</div>
              <div className="stat-label">Purchase Orders</div>
            </div>
            <div className="stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
              🛒
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            3 vendor purchase orders pending signoff
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab('grn')}
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'grn' ? '4px solid var(--success)' : '1px solid var(--border)',
            background: activeTab === 'grn' ? 'var(--success-lt)' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--success)' }}>{grnCount}</div>
              <div className="stat-label">Goods Receipt Notes (GRN)</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--success-lt)', color: 'var(--success)' }}>
              📥
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            2 delivery verification indents
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--navy)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--navy)' }}>{totalPending}</div>
              <div className="stat-label">Total Pending Actions</div>
            </div>
            <div className="stat-icon" style={{ background: '#f1f5f9', color: 'var(--navy)' }}>
              ⚡
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            High priority items flagged
          </div>
        </div>
      </div>

      {/* ── Tab Navigation Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '2px solid var(--border)',
        marginBottom: '16px',
        paddingLeft: '4px'
      }}>
        {/* Tab 1: Material Requests (7) */}
        <button
          type="button"
          onClick={() => setActiveTab('mr')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'mr' ? '700' : '500',
            color: activeTab === 'mr' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'mr' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <span>📦 Material Requests</span>
          <span style={{
            background: activeTab === 'mr' ? 'var(--primary)' : 'var(--border-strong)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {mrCount}
          </span>
        </button>

        {/* Tab 2: Purchase Orders (3) */}
        <button
          type="button"
          onClick={() => setActiveTab('po')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'po' ? '700' : '500',
            color: activeTab === 'po' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'po' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <span>🛒 Purchase Orders</span>
          <span style={{
            background: activeTab === 'po' ? 'var(--primary)' : 'var(--border-strong)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {poCount}
          </span>
        </button>

        {/* Tab 3: GRN (2) */}
        <button
          type="button"
          onClick={() => setActiveTab('grn')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'grn' ? '700' : '500',
            color: activeTab === 'grn' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'grn' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <span>📥 GRN</span>
          <span style={{
            background: activeTab === 'grn' ? 'var(--primary)' : 'var(--border-strong)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {grnCount}
          </span>
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Site Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{ minWidth: '130px' }}
            >
              {SITE_FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              {PRIORITY_FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Date Range:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ minWidth: '110px' }}
            >
              {DATE_FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search request #, site, requester, material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '28px' }}
            />
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              🔍
            </span>
          </div>
        </div>

        {(siteFilter !== 'All Sites' || priorityFilter !== 'All Priorities' || searchQuery) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSiteFilter('All Sites');
              setPriorityFilter('All Priorities');
              setSearchQuery('');
            }}
            style={{ fontSize: '0.78rem', color: 'var(--danger)' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {/* ── Approvals Table ── */}
      <div className="table-responsive" style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Request No</th>
              <th style={{ width: '140px' }}>Site</th>
              <th style={{ width: '170px' }}>Requested By</th>
              <th style={{ width: '130px' }}>Amount</th>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '110px' }}>Priority</th>
              <th style={{ width: '140px' }}>Status</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDataset.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-state-icon">✓</div>
                    <div className="empty-state-title">No pending approvals found</div>
                    <div className="empty-state-text">
                      All requests under this filter have been actioned or no matching items exist.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDataset.map((row) => (
                <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenReview(row)}>
                  {/* Request No */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        {row.request_no}
                      </span>
                      {row.vendor_name && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                          {row.vendor_name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Site */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem' }}>🏗️</span>
                      <span style={{ fontWeight: '600', color: 'var(--navy)' }}>
                        {row.site}
                      </span>
                    </div>
                  </td>

                  {/* Requested By */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--navy-50)',
                        border: '1px solid var(--border)',
                        color: 'var(--navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {(row.requested_by || 'U').charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '0.83rem' }}>
                          {row.requested_by}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {row.requested_by_role || 'Site Engineer'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td>
                    <span style={{ fontWeight: '700', color: 'var(--navy)', fontSize: '0.88rem' }}>
                      {formatAED(row.amount)}
                    </span>
                  </td>

                  {/* Date */}
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {row.date}
                    </span>
                  </td>

                  {/* Priority */}
                  <td>
                    {renderPriorityBadge(row.priority)}
                  </td>

                  {/* Status */}
                  <td>
                    {renderStatusBadge(row.status)}
                  </td>

                  {/* Action Button */}
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenReview(row)}
                      style={{ padding: '5px 14px', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Review Drawer / Modal (Slide-Over / Large Modal) ── */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Approval Review: ${currentReviewItem?.request_no || ''}`}
        subtitle={`${currentReviewItem?.site_full || currentReviewItem?.site} • Submitted on ${currentReviewItem?.date}`}
        icon="⚖️"
        size="xl"
      >
        {currentReviewItem && (
          <div>
            {actionAlert && (
              <div className={`alert alert-${actionAlert.type}`} style={{ marginBottom: '16px' }}>
                <span>{actionAlert.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{actionAlert.message}</span>
              </div>
            )}

            {/* Visual 4-Step Approval Timeline */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                Visual Approval Workflow
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', position: 'relative' }}>
                {(currentReviewItem.timeline || []).map((step, idx) => {
                  const isApproved = step.status === 'Approved';
                  const isPending = step.status === 'Pending' || step.status === 'Pending Approval';
                  const isUpcoming = step.status === 'Upcoming';

                  return (
                    <div
                      key={idx}
                      style={{
                        background: isPending ? '#fff' : isApproved ? '#f0fdf4' : '#fff',
                        border: isPending ? '2px solid var(--primary)' : isApproved ? '1px solid #bbf7d0' : '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        boxShadow: isPending ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: isApproved ? 'var(--success)' : isPending ? 'var(--primary)' : 'var(--border)',
                          color: isUpcoming ? 'var(--text-secondary)' : '#fff'
                        }}>
                          {isApproved ? '✓' : step.step}
                        </div>

                        <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--navy)' }}>
                          {step.role}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: isApproved ? '#15803d' : isPending ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {step.name}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {step.date}
                      </div>

                      {step.note && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                          "{step.note}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Site & Requester Metadata Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Card 1: Site & Location Details */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Site & Job Location
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--navy)' }}>
                  {currentReviewItem.site_full || currentReviewItem.site}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Project: {currentReviewItem.project_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', marginTop: '6px' }}>
                  <strong>Activity:</strong> {currentReviewItem.purpose}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong>Unloading Bay:</strong> {currentReviewItem.delivery_location || 'Main Site Store'}
                </div>
              </div>

              {/* Card 2: Requester & Financial Summary */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Requester & Priority
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--navy)' }}>
                      {currentReviewItem.requested_by}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Role: {currentReviewItem.requested_by_role}
                    </div>
                  </div>
                  <div>
                    {renderPriorityBadge(currentReviewItem.priority)}
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Estimated Value:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                      {formatAED(currentReviewItem.amount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Delivery:</span>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--navy)' }}>
                      {currentReviewItem.date_needed || currentReviewItem.date}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials List Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase' }}>
                  Materials Breakdown & Stock Allowance
                </div>
                <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '600', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ Within BOQ Allowance
                </span>
              </div>

              <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '6px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Material Name</th>
                      <th>Requested Qty</th>
                      <th>Est. Unit Cost</th>
                      <th>Line Total</th>
                      <th>Available Stock</th>
                      <th>BOQ Quota Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReviewItem.materials || []).map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{m.name}</td>
                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                          {m.qty} {m.unit}
                        </td>
                        <td>{m.est_rate ? formatAED(m.est_rate) : '-'}</td>
                        <td style={{ fontWeight: '600', color: 'var(--navy)' }}>
                          {formatAED(m.total)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Site: <strong style={{ color: 'var(--navy)' }}>{m.site_stock || 'None'}</strong>
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Warehouse: {m.wh_stock || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: '500' }}>
                            {m.boq_quota || currentReviewItem.boq_allowance || 'Within quota'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reviewer Comments & Quick Chips */}
            <div style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ fontWeight: '600' }}>
                Reviewer Remarks & Audit Notes
              </label>
              <textarea
                className="form-control"
                rows="3"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Enter remarks, approval conditions, or justification notes..."
                style={{ fontSize: '0.85rem' }}
              />

              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick insert:</span>
                {QUICK_COMMENTS.map((chip, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setReviewComments(chip)}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      background: '#fff',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--navy-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    + {chip.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsReviewOpen(false)}
                disabled={actionLoading}
              >
                Close Drawer
              </button>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Send Back (Amber) */}
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => handleWorkflowAction('send_back')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>↩️</span>
                  <span>Send Back</span>
                </button>

                {/* Reject (Red) */}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleWorkflowAction('reject')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>✕</span>
                  <span>Reject</span>
                </button>

                {/* Approve with Changes (Blue) */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleWorkflowAction('approve_changes')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>✏️</span>
                  <span>Approve with Changes</span>
                </button>

                {/* Approve (Green) */}
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleWorkflowAction('approve')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <span>✓</span>
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalCenter;
