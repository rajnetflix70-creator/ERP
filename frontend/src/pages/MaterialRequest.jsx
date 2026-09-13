import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';

const SITES_OPTIONS = ['All Sites'];
const STATUS_OPTIONS = ['All Statuses', 'Pending', 'Approved', 'Ordered', 'Delivered', 'Rejected'];
const DATE_OPTIONS = ['All Time', 'Today', 'Last 7 Days', 'This Month'];

const formatINR = (val) => {
  if (!val && val !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const MaterialRequest = () => {
  const navigate = useNavigate();

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Details Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch from API & local storage fallback
  useEffect(() => {
    let isMounted = true;
    const fetchApiData = async () => {
      try {
        setLoading(true);
        const res = await client.get('/material-requests?limit=200');
        const raw = res.data?.data?.data || res.data?.data || res.data || [];
        const localStored = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');

        let mapped = [];
        if (Array.isArray(raw)) {
          mapped = raw.map(item => ({
            id: item.id,
            mr_number: item.mr_number || item.request_number || item.request_no || item.pr_number || `MR-${item.id?.slice(0, 6)}`,
            site: item.site_name || item.site || '-',
            project_name: item.project_name || '-',
            requested_by: item.requested_by_name || item.requester_name || item.requested_by || 'Site Engineer',
            requested_by_role: 'Site Engineer',
            amount: Number(item.total_amount || item.amount || 0),
            created_at: item.created_at || new Date().toISOString(),
            date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            required_date: item.required_date ? (typeof item.required_date === 'string' && item.required_date.includes('-') ? new Date(item.required_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : item.required_date) : '-',
            priority: item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Normal',
            status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')) : 'Pending',
            purpose: item.purpose || item.remarks || '-',
            material_summary: item.material_summary || (item.items?.length ? `${item.items[0]?.name || 'Material'} (${item.items.length} items)` : (item.material_name || 'Materials')),
            more_items_count: item.items?.length > 1 ? item.items.length - 1 : 0,
            items: Array.isArray(item.items) ? item.items : [],
            remarks: item.remarks || ''
          }));
        }

        const existingIds = new Set(mapped.map(m => String(m.id || m.mr_number)));
        const extraLocal = localStored.filter(m => !existingIds.has(String(m.id || m.mr_number)));
        const mergedAll = [...extraLocal, ...mapped];

        if (isMounted) setRequests(mergedAll);
      } catch (err) {
        console.warn('Error fetching material requests:', err);
        const localStored = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');
        if (isMounted && localStored.length > 0) setRequests(localStored);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApiData();
    return () => { isMounted = false; };
  }, []);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Site filter
      if (siteFilter !== 'All Sites') {
        const siteStr = (r.site || '').toLowerCase();
        if (!siteStr.includes(siteFilter.toLowerCase())) return false;
      }

      // Status filter
      if (statusFilter !== 'All Statuses') {
        const statusStr = (r.status || '').toLowerCase();
        if (statusStr !== statusFilter.toLowerCase()) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchMr = (r.mr_number || '').toLowerCase().includes(term);
        const matchSite = (r.site || '').toLowerCase().includes(term);
        const matchReqBy = (r.requested_by || '').toLowerCase().includes(term);
        const matchMat = (r.material_summary || '').toLowerCase().includes(term);
        const matchProj = (r.project_name || '').toLowerCase().includes(term);
        if (!matchMr && !matchSite && !matchReqBy && !matchMat && !matchProj) return false;
      }

      return true;
    });
  }, [requests, siteFilter, statusFilter, searchTerm]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const approved = requests.filter(r => ['approved', 'ordered'].includes((r.status || '').toLowerCase())).length;
    const delivered = requests.filter(r => (r.status || '').toLowerCase() === 'delivered').length;
    const totalValue = requests.reduce((acc, r) => acc + (r.amount || 0), 0);

    return { total, pending, approved, delivered, totalValue };
  }, [requests]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'approved') {
      return <span className="badge badge-success badge-dot">Approved</span>;
    }
    if (s === 'ordered') {
      return <span className="badge badge-info badge-dot">Ordered</span>;
    }
    if (s === 'delivered') {
      return (
        <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0f766e', display: 'inline-block' }} />
          Delivered
        </span>
      );
    }
    if (s === 'rejected') {
      return <span className="badge badge-danger badge-dot">Rejected</span>;
    }
    // Pending
    return <span className="badge badge-warning badge-dot">Pending</span>;
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority) => {
    const p = (priority || 'Normal').toLowerCase();
    if (p === 'urgent') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: '700',
          background: '#fee2e2',
          color: '#dc2626'
        }}>
          🔥 Urgent
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: '600',
          background: '#fef3c7',
          color: '#d97706'
        }}>
          ⚡ High
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.72rem',
        fontWeight: '500',
        background: '#eff6ff',
        color: '#2563eb'
      }}>
        Normal
      </span>
    );
  };

  const handleOpenDetails = (req) => {
    setSelectedRequest(req);
    setShowDetailModal(true);
  };

  return (
    <div className="page-container" style={{ paddingBottom: '30px' }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Material Requests</h1>
            <span style={{
              background: 'var(--primary-lt)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Screen 5
            </span>
          </div>
          <p className="page-subtitle">
            Create, track, and manage material requisitions across all job sites
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/approvals"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>✅</span>
            <span>Approval Center ({kpis.pending})</span>
          </Link>

          <Link
            to="/materials/requests/new"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>+</span>
            <span>New Material Request</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--navy)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number">{kpis.total}</div>
              <div className="stat-label">Total Material Requests</div>
            </div>
            <div className="stat-icon" style={{ background: '#f1f5f9', color: 'var(--navy)' }}>
              📦
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Across 6 active site locations
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--warning)' }}>{kpis.pending}</div>
              <div className="stat-label">Pending Approval</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--warning-lt)', color: 'var(--warning)' }}>
              ⏳
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Awaiting PM / In-Charge review
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--primary)' }}>{kpis.approved}</div>
              <div className="stat-label">Approved & Ordered</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>
              🚚
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            In procurement & transit
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--success)' }}>{kpis.delivered}</div>
              <div className="stat-label">Delivered & Closed</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--success-lt)', color: 'var(--success)' }}>
              ✓
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Materials received & inspected
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Site Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => { setSiteFilter(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: '140px' }}
            >
              {SITES_OPTIONS.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: '130px' }}
            >
              {STATUS_OPTIONS.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: '110px' }}
            >
              {DATE_OPTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search MR No, requester, material..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', paddingLeft: '28px' }}
            />
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Clear filters if active */}
        {(siteFilter !== 'All Sites' || statusFilter !== 'All Statuses' || searchTerm) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSiteFilter('All Sites');
              setStatusFilter('All Statuses');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            style={{ fontSize: '0.78rem', color: 'var(--danger)' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="table-responsive" style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ width: '110px' }}>MR No</th>
              <th style={{ width: '140px' }}>Site / Project</th>
              <th style={{ width: '160px' }}>Requested By</th>
              <th>Material Summary</th>
              <th style={{ width: '120px' }}>Required Date</th>
              <th style={{ width: '90px' }}>Priority</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div className="loading-spinner" />
                    <span>Loading material requests...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">No material requests found</div>
                    <div className="empty-state-text">
                      Try adjusting your site or status filters, or create a new request.
                    </div>
                    <Link to="/materials/requests/new" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                      + Raise New Request
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => (
                <tr key={r.id || r.mr_number} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(r)}>
                  {/* MR No */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        {r.mr_number}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {r.date}
                      </span>
                    </div>
                  </td>

                  {/* Site */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: 'var(--navy)' }}>
                        {r.site}
                      </span>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        {r.project_name}
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
                        background: 'var(--primary-lt)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {(r.requested_by || 'U').charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '0.83rem' }}>
                          {r.requested_by}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {r.requested_by_role || 'Site Engineer'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Material Summary */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--navy)', fontWeight: '500', fontSize: '0.82rem' }}>
                        {r.material_summary || (r.items && r.items[0]?.name) || 'Construction Materials'}
                      </span>
                      {r.more_items_count > 0 && (
                        <span style={{
                          background: 'var(--navy-50)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '1px 6px',
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                          fontWeight: '600'
                        }}>
                          +{r.more_items_count} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Required Date */}
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--navy)' }}>
                      {r.required_date || '-'}
                    </span>
                  </td>

                  {/* Priority */}
                  <td>
                    {renderPriorityBadge(r.priority)}
                  </td>

                  {/* Status */}
                  <td>
                    {renderStatusBadge(r.status)}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenDetails(r)}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Pagination & Info Bar ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} requests
          </span>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {totalPages > 1 && (
          <div className="pagination" style={{ margin: 0, padding: 0 }}>
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ‹
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* ── Detail Drawer / Modal ── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Material Request: ${selectedRequest?.mr_number || ''}`}
        subtitle={`Submitted for ${selectedRequest?.site} • ${selectedRequest?.date}`}
        icon="📋"
        size="lg"
      >
        {selectedRequest && (
          <div>
            {/* Header info strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              background: 'var(--navy-50)',
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Site & Project
                </span>
                <div style={{ fontWeight: '700', color: 'var(--navy)', fontSize: '0.88rem' }}>
                  {selectedRequest.site}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {selectedRequest.project_name}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Requester
                </span>
                <div style={{ fontWeight: '600', color: 'var(--navy)', fontSize: '0.88rem' }}>
                  {selectedRequest.requested_by}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {selectedRequest.requested_by_role || 'Site Engineer'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Required Date & Priority
                </span>
                <div style={{ fontWeight: '600', color: 'var(--navy)', fontSize: '0.88rem' }}>
                  {selectedRequest.required_date}
                </div>
                <div style={{ marginTop: '2px' }}>
                  {renderPriorityBadge(selectedRequest.priority)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Status & Est. Amount
                </span>
                <div>
                  {renderStatusBadge(selectedRequest.status)}
                </div>
                <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.92rem', marginTop: '2px' }}>
                  {formatINR(selectedRequest.amount)}
                </div>
              </div>
            </div>

            {/* Purpose & Remarks */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Activity / Purpose
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', background: '#fff', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '4px' }}>
                {selectedRequest.purpose || 'General construction activity'}
              </div>
            </div>

            {selectedRequest.remarks && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Site Remarks & Constraints
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: '#fff', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '4px' }}>
                  "{selectedRequest.remarks}"
                </div>
              </div>
            )}

            {/* Materials Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Material Line Items ({selectedRequest.items?.length || 1})</span>
                <span style={{ color: 'var(--primary)', textTransform: 'none', fontWeight: '600' }}>
                  Est. Total: {formatINR(selectedRequest.amount)}
                </span>
              </div>

              <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '6px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Material Name</th>
                      <th>Qty Required</th>
                      <th>Unit</th>
                      <th>Est. Unit Cost</th>
                      <th>Available Stock</th>
                      <th>BOQ Quota Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRequest.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{it.name}</td>
                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{it.quantity}</td>
                        <td>{it.unit}</td>
                        <td>{it.est_rate ? formatINR(it.est_rate) : '-'}</td>
                        <td>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: it.available_stock > 5 ? '#dcfce7' : '#fee2e2',
                            color: it.available_stock > 5 ? '#15803d' : '#b91c1c',
                            fontWeight: '600',
                            fontSize: '0.75rem'
                          }}>
                            {it.available_stock} {it.unit}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {it.boq_allowance || 'Within limit'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>

              {selectedRequest.status === 'Pending' && (
                <Link
                  to="/approvals"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Review in Approval Center</span>
                  <span>→</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaterialRequest;
