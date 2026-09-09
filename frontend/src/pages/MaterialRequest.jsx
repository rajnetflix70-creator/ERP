import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';

// Initial realistic Indian construction sample data matching BuildTrack / Screen 5 & Screen 7
const DEFAULT_REQUESTS = [
  {
    id: 'mr-1024',
    mr_number: 'MR-1024',
    site: 'Tower A',
    project_name: 'High Rise Luxury Towers',
    requested_by: 'Rajesh Kumar',
    requested_by_role: 'Site Engineer',
    amount: 248000,
    created_at: '2026-09-09T08:30:00Z',
    date: '09-Sep-2026',
    required_date: '15-Sep-2026',
    priority: 'Urgent',
    status: 'Pending',
    purpose: 'Slab Casting 8th Floor - Grid A to D',
    material_summary: 'TMT Rebar 16mm (20 MT), Cement OPC 53 (500 Bags)',
    more_items_count: 1,
    items: [
      { name: 'TMT Steel Rebar 16mm (Fe550D)', quantity: 20, unit: 'MT', est_rate: 58000, line_total: 1160000, available_stock: 2, boq_allowance: '68% consumed (32 MT remaining)' },
      { name: 'OPC 53 Grade Cement (50kg Bag)', quantity: 500, unit: 'Bags', est_rate: 380, line_total: 190000, available_stock: 120, boq_allowance: '72% consumed (480 Bags remaining)' },
      { name: 'Binding Wire 18 Gauge', quantity: 300, unit: 'Kg', est_rate: 70, line_total: 21000, available_stock: 50, boq_allowance: 'Within limits' },
    ],
    remarks: 'Unloading after 8 PM only due to traffic restrictions. Crane required for offloading.',
  },
  {
    id: 'mr-1023',
    mr_number: 'MR-1023',
    site: 'Tower B',
    project_name: 'High Rise Luxury Towers',
    requested_by: 'Anil Verma',
    requested_by_role: 'Store Incharge',
    amount: 580000,
    created_at: '2026-09-09T07:15:00Z',
    date: '09-Sep-2026',
    required_date: '12-Sep-2026',
    priority: 'High',
    status: 'Pending',
    purpose: 'Columns & Shear Wall Concrete Pour',
    material_summary: 'Ready Mix Concrete M30 (120 Cu.m), River Sand (800 Cu.ft)',
    more_items_count: 0,
    items: [
      { name: 'Ready Mix Concrete (RMC) M30', quantity: 120, unit: 'Cu.m', est_rate: 4600, line_total: 552000, available_stock: 0, boq_allowance: '60% consumed' },
      { name: 'River Sand (Coarse)', quantity: 800, unit: 'Cu.ft', est_rate: 65, line_total: 52000, available_stock: 250, boq_allowance: '54% consumed' },
    ],
    remarks: 'Pumping arrangement needed from transit mixer.',
  },
  {
    id: 'mr-1022',
    mr_number: 'MR-1022',
    site: 'Villa Project',
    project_name: 'Palm Grove Gated Community',
    requested_by: 'Vikram Singh',
    requested_by_role: 'Project Engineer',
    amount: 98000,
    created_at: '2026-09-08T15:45:00Z',
    date: '08-Sep-2026',
    required_date: '18-Sep-2026',
    priority: 'Normal',
    status: 'Pending',
    purpose: 'Plumbing Shaft Risers & Villa Internal Piping',
    material_summary: 'CPVC Pipes 1" (300 Mtr), Finolex Cables 2.5mm (15 Bundles)',
    more_items_count: 2,
    items: [
      { name: 'CPVC Pipes 1 inch (SDR 11)', quantity: 300, unit: 'Meter', est_rate: 140, line_total: 42000, available_stock: 45, boq_allowance: 'Within allowance' },
      { name: 'Finolex FRLS Copper Wire 2.5 sq.mm', quantity: 15, unit: 'Bundle', est_rate: 2450, line_total: 36750, available_stock: 3, boq_allowance: '80% consumed' },
      { name: 'CPVC Solvent Cement 500ml', quantity: 12, unit: 'Tins', est_rate: 350, line_total: 4200, available_stock: 2, boq_allowance: 'Normal' },
      { name: 'Brass Ball Valves 1 inch', quantity: 25, unit: 'Nos', est_rate: 450, line_total: 11250, available_stock: 5, boq_allowance: 'Normal' },
    ],
    remarks: 'Approved ISI marked make only.',
  },
  {
    id: 'mr-1021',
    mr_number: 'MR-1021',
    site: 'Warehouse',
    project_name: 'Central Logistics Facility',
    requested_by: 'Suresh Patel',
    requested_by_role: 'Store Incharge',
    amount: 175000,
    created_at: '2026-09-08T11:00:00Z',
    date: '08-Sep-2026',
    required_date: '14-Sep-2026',
    priority: 'Normal',
    status: 'Pending',
    purpose: 'Shuttering Stock Replacement & Safety Kits',
    material_summary: 'Shuttering Plywood 12mm (80 Sheets), Safety Helmets (100 Sets)',
    more_items_count: 0,
    items: [
      { name: 'Shuttering Plywood 12mm (Marine Grade)', quantity: 80, unit: 'Sheet', est_rate: 1450, line_total: 116000, available_stock: 12, boq_allowance: 'Site replenishment' },
      { name: 'Safety Helmets & Harness Kits', quantity: 45, unit: 'Sets', est_rate: 1250, line_total: 56250, available_stock: 8, boq_allowance: 'Safety compliance' },
    ],
    remarks: 'Required for new batch of subcontract labor joining next week.',
  },
  {
    id: 'mr-1020',
    mr_number: 'MR-1020',
    site: 'Tower C',
    project_name: 'High Rise Luxury Towers',
    requested_by: 'Manoj Sharma',
    requested_by_role: 'Site Engineer',
    amount: 320000,
    created_at: '2026-09-07T16:20:00Z',
    date: '07-Sep-2026',
    required_date: '16-Sep-2026',
    priority: 'High',
    status: 'Pending',
    purpose: 'Raft Foundation Reinforcement & Beams',
    material_summary: 'TMT Rebar 12mm (25 MT), Binding Wire (500 Kg)',
    more_items_count: 0,
    items: [
      { name: 'TMT Steel Rebar 12mm (Fe550D)', quantity: 25, unit: 'MT', est_rate: 58500, line_total: 1462500, available_stock: 4, boq_allowance: '71% consumed' },
      { name: 'Binding Wire 18 Gauge', quantity: 500, unit: 'Kg', est_rate: 70, line_total: 35000, available_stock: 20, boq_allowance: 'Normal' },
    ],
    remarks: 'Bar bending schedule BBS-C-04 attached.',
  },
  {
    id: 'mr-1019',
    mr_number: 'MR-1019',
    site: 'Commercial',
    project_name: 'Metro Hub Business Park',
    requested_by: 'Pooja Gupta',
    requested_by_role: 'Project Engineer',
    amount: 85000,
    created_at: '2026-09-07T10:10:00Z',
    date: '07-Sep-2026',
    required_date: '20-Sep-2026',
    priority: 'Normal',
    status: 'Pending',
    purpose: 'Exterior Facade Painting & Weatherproofing',
    material_summary: 'Asian Paints Apex Ultima (180 Ltr), Exterior Primer (100 Ltr)',
    more_items_count: 1,
    items: [
      { name: 'Asian Paints Apex Ultima Exterior', quantity: 180, unit: 'Liters', est_rate: 385, line_total: 69300, available_stock: 10, boq_allowance: '52% consumed' },
      { name: 'Exterior Wall Primer', quantity: 100, unit: 'Liters', est_rate: 160, line_total: 16000, available_stock: 15, boq_allowance: 'Within quota' },
    ],
    remarks: 'Shade code: Brilliant White & Slate Gray.',
  },
  {
    id: 'mr-1018',
    mr_number: 'MR-1018',
    site: 'Tower A',
    project_name: 'High Rise Luxury Towers',
    requested_by: 'Rajesh Kumar',
    requested_by_role: 'Site Engineer',
    amount: 410000,
    created_at: '2026-09-06T14:30:00Z',
    date: '06-Sep-2026',
    required_date: '13-Sep-2026',
    priority: 'Urgent',
    status: 'Pending',
    purpose: 'Internal AAC Block Masonry 6th to 8th Floor',
    material_summary: 'AAC Blocks 600x200x150mm (4000 Nos), Block Adhesive (80 Bags)',
    more_items_count: 0,
    items: [
      { name: 'AAC Lightweight Blocks (600x200x150mm)', quantity: 4000, unit: 'Nos', est_rate: 62, line_total: 248000, available_stock: 350, boq_allowance: '64% consumed' },
      { name: 'AAC Block Jointing Adhesive (40kg)', quantity: 80, unit: 'Bags', est_rate: 420, line_total: 33600, available_stock: 10, boq_allowance: 'Within allowance' },
    ],
    remarks: 'Palletized delivery required with forklift assistance.',
  },
  {
    id: 'mr-1017',
    mr_number: 'MR-1017',
    site: 'Tower B',
    project_name: 'High Rise Luxury Towers',
    requested_by: 'Anil Verma',
    requested_by_role: 'Store Incharge',
    amount: 145000,
    created_at: '2026-09-04T09:00:00Z',
    date: '04-Sep-2026',
    required_date: '10-Sep-2026',
    priority: 'Normal',
    status: 'Approved',
    purpose: 'Plastering Mortar & Screed Flooring',
    material_summary: 'Crushed Blue Stone 20mm (1500 Cu.ft), River Sand (1200 Cu.ft)',
    more_items_count: 0,
    items: [
      { name: '20mm Crushed Blue Stone Aggregate', quantity: 1500, unit: 'Cu.ft', est_rate: 48, line_total: 72000, available_stock: 400, boq_allowance: 'Within budget' },
      { name: 'River Sand (Coarse / Plastering)', quantity: 1200, unit: 'Cu.ft', est_rate: 65, line_total: 78000, available_stock: 300, boq_allowance: 'Within budget' },
    ],
    remarks: 'Approved by PM Amit Desai.',
  },
  {
    id: 'mr-1016',
    mr_number: 'MR-1016',
    site: 'Villa Project',
    project_name: 'Palm Grove Gated Community',
    requested_by: 'Vikram Singh',
    requested_by_role: 'Project Engineer',
    amount: 225000,
    created_at: '2026-09-02T11:45:00Z',
    date: '02-Sep-2026',
    required_date: '08-Sep-2026',
    priority: 'High',
    status: 'Ordered',
    purpose: 'Compound Wall & Villa Boundary Masonry',
    material_summary: 'Standard Red Clay Kiln Bricks (25,000 Nos)',
    more_items_count: 0,
    items: [
      { name: 'Standard Red Clay Kiln Bricks', quantity: 25000, unit: 'Nos', est_rate: 9, line_total: 225000, available_stock: 1200, boq_allowance: 'Approved under PO-8815' },
    ],
    remarks: 'PO issued to Bharat Bricks kiln supplier.',
  },
  {
    id: 'mr-1015',
    mr_number: 'MR-1015',
    site: 'Commercial',
    project_name: 'Metro Hub Business Park',
    requested_by: 'Pooja Gupta',
    requested_by_role: 'Project Engineer',
    amount: 378000,
    created_at: '2026-08-30T13:20:00Z',
    date: '30-Aug-2026',
    required_date: '05-Sep-2026',
    priority: 'Normal',
    status: 'Delivered',
    purpose: 'Basement Level 2 Driveway Concrete Paving',
    material_summary: 'Ready Mix Concrete M25 (90 Cu.m)',
    more_items_count: 0,
    items: [
      { name: 'Ready Mix Concrete (RMC) M25', quantity: 90, unit: 'Cu.m', est_rate: 4200, line_total: 378000, available_stock: 90, boq_allowance: 'GRN-4008 generated' },
    ],
    remarks: 'Delivered and verified by QA/QC.',
  },
  {
    id: 'mr-1014',
    mr_number: 'MR-1014',
    site: 'Tower A',
    project_name: 'High Rise Luxury Towers',
    requested_by: 'Rajesh Kumar',
    requested_by_role: 'Site Engineer',
    amount: 480000,
    created_at: '2026-08-28T15:10:00Z',
    date: '28-Aug-2026',
    required_date: '01-Sep-2026',
    priority: 'High',
    status: 'Rejected',
    purpose: 'Special Structural Steel Truss Fabrication',
    material_summary: 'Structural Steel ISMB Sections (8 MT)',
    more_items_count: 0,
    items: [
      { name: 'Structural Steel ISMB 250 Sections', quantity: 8, unit: 'MT', est_rate: 60000, line_total: 480000, available_stock: 0, boq_allowance: 'Exceeds revised GFC revision' },
    ],
    remarks: 'Rejected by PM: Design changed to RCC girder. Revise indent.',
  },
];

const SITES_OPTIONS = ['All Sites', 'Tower A', 'Tower B', 'Villa Project', 'Warehouse', 'Tower C', 'Commercial'];
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
  const [requests, setRequests] = useState(() => {
    try {
      const stored = localStorage.getItem('sitetrack_material_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Combine stored with default avoiding duplicate ids
        const storedIds = new Set(parsed.map(p => p.mr_number || p.id));
        const combined = [...parsed, ...DEFAULT_REQUESTS.filter(d => !storedIds.has(d.mr_number))];
        return combined;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_REQUESTS;
  });

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

  // Fetch from API in background if available
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        setLoading(true);
        const res = await client.get('/materials/requests/all');
        const apiData = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        if (apiData.length > 0) {
          // Normalize API data
          const mapped = apiData.map(item => ({
            id: item.id || 'mr_' + item.mr_number,
            mr_number: item.mr_number || item.job_no || 'MR-REQ',
            site: item.site_name || item.project_name || 'Site',
            project_name: item.project_name || 'Project',
            requested_by: item.requested_by_name || item.engineer || 'Site Engineer',
            requested_by_role: 'Site Engineer',
            amount: item.amount || 150000,
            created_at: item.created_at || new Date().toISOString(),
            date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            required_date: item.date_needed || 'Within 7 days',
            priority: item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Normal',
            status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending',
            purpose: item.purpose || 'Site construction requirement',
            material_summary: item.material_name ? `${item.material_name} (${item.qty_requested || ''} ${item.unit_of_measure || ''})` : 'Materials',
            items: [
              {
                name: item.material_name || 'Material Item',
                quantity: item.qty_requested || 10,
                unit: item.unit_of_measure || 'Nos',
                est_rate: 5000,
                line_total: 50000,
                available_stock: 5,
                boq_allowance: 'Within allowance'
              }
            ]
          }));

          setRequests(prev => {
            const apiIds = new Set(mapped.map(m => m.mr_number));
            const remaining = prev.filter(p => !apiIds.has(p.mr_number));
            return [...mapped, ...remaining];
          });
        }
      } catch (err) {
        // graceful fallback to default/stored requests
      } finally {
        setLoading(false);
      }
    };

    fetchApiData();
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
