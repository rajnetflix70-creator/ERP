import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// Indian currency formatter
const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Initial realistic Indian construction Purchase Register data
// Designed to have totals like ₹14,40,000 when filtered or as key total
const INITIAL_PURCHASE_RECORDS = [
  {
    id: 'pr-1',
    po_no: 'PO-2026-0842',
    po_date: '2026-09-03',
    site_name: 'Metro Phase 2 - Station 4',
    vendor_name: 'Tata Steel BSL Ltd',
    material_summary: 'Tata Tiscon TMT Fe550D Rebar 16mm (20 MT)',
    category: 'Steel & Rebar',
    base_amount: 1220339,
    gst_amount: 219661,
    amount: 1440000, // Exact ₹14,40,000
    status: 'Open',
    payment_terms: '50% Adv, 50% Del',
  },
  {
    id: 'pr-2',
    po_no: 'PO-2026-0841',
    po_date: '2026-09-02',
    site_name: 'Tower A - Expressway Project',
    vendor_name: 'UltraTech Cement Ltd',
    material_summary: 'UltraTech 53 Grade Cement (1,000 Bags)',
    category: 'Cement',
    base_amount: 378906,
    gst_amount: 106094,
    amount: 485000,
    status: 'Approved',
    payment_terms: '30 Days Net',
  },
  {
    id: 'pr-3',
    po_no: 'PO-2026-0843',
    po_date: '2026-09-04',
    site_name: 'Tower A - Expressway Project',
    vendor_name: 'RMC Readymix India',
    material_summary: 'Ready Mix Concrete M25 Grade (65 Cu.m)',
    category: 'Concrete',
    base_amount: 271186,
    gst_amount: 48814,
    amount: 320000,
    status: 'Partial',
    payment_terms: '15 Days Net',
  },
  {
    id: 'pr-4',
    po_no: 'PO-2026-0845',
    po_date: '2026-09-01',
    site_name: 'Greenfield Highway Km 42',
    vendor_name: 'Jindal Steel & Power',
    material_summary: 'Tata Tiscon TMT Fe550D Rebar 12mm (12 MT)',
    category: 'Steel & Rebar',
    base_amount: 741525,
    gst_amount: 133475,
    amount: 875000,
    status: 'Approved',
    payment_terms: '30 Days Net',
  },
  {
    id: 'pr-5',
    po_no: 'PO-2026-0844',
    po_date: '2026-08-28',
    site_name: 'Prestige Tech Park - Phase 1',
    vendor_name: 'Asian Paints Ltd',
    material_summary: 'Asian Paints Apex Ultima White (450 Litres)',
    category: 'Paints & Finishes',
    base_amount: 156780,
    gst_amount: 28220,
    amount: 185000,
    status: 'Closed',
    payment_terms: 'Immediate',
  },
  {
    id: 'pr-6',
    po_no: 'PO-2026-0847',
    po_date: '2026-08-22',
    site_name: 'Tower A - Expressway Project',
    vendor_name: 'Godrej Construction Aggregates',
    material_summary: 'Coarse River Sand Zone II (150 Cu.m)',
    category: 'Aggregates & Sand',
    base_amount: 264285,
    gst_amount: 13215,
    amount: 277500,
    status: 'Closed',
    payment_terms: '30 Days Net',
  },
  {
    id: 'pr-7',
    po_no: 'PO-2026-0846',
    po_date: '2026-08-20',
    site_name: 'CyberCity Commercial Complex',
    vendor_name: 'Supreme Industries Ltd',
    material_summary: 'Supreme PVC Conduit Pipe 25mm (1,500 M)',
    category: 'Piping & Electrical',
    base_amount: 80508,
    gst_amount: 14492,
    amount: 95000,
    status: 'Cancelled',
    payment_terms: 'Immediate',
  },
];

const PurchaseRegister = () => {
  const navigate = useNavigate();

  // Screen 16 Filters: Date Range (From - To), Site, Vendor, Material
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [siteFilter, setSiteFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [records, setRecords] = useState(INITIAL_PURCHASE_RECORDS);

  // Available options for dropdowns
  const sites = useMemo(() => Array.from(new Set(INITIAL_PURCHASE_RECORDS.map(r => r.site_name))), []);
  const vendors = useMemo(() => Array.from(new Set(INITIAL_PURCHASE_RECORDS.map(r => r.vendor_name))), []);
  const materials = useMemo(() => [
    'Cement',
    'Steel & Rebar',
    'Concrete',
    'Aggregates & Sand',
    'Paints & Finishes',
    'Piping & Electrical'
  ], []);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      const itemDate = item.po_date;
      const matchFrom = !fromDate || itemDate >= fromDate;
      const matchTo = !toDate || itemDate <= toDate;
      const matchSite = !siteFilter || item.site_name === siteFilter;
      const matchVendor = !vendorFilter || item.vendor_name === vendorFilter;
      const matchMaterial = !materialFilter || item.category === materialFilter || item.material_summary.toLowerCase().includes(materialFilter.toLowerCase());

      return matchFrom && matchTo && matchSite && matchVendor && matchMaterial;
    });
  }, [records, fromDate, toDate, siteFilter, vendorFilter, materialFilter]);

  // Screen 16 Explicit Requirement: Bottom Summary: Total Purchase: ₹14,40,000 (dynamic)
  const totalPurchase = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }, [filteredRecords]);

  const totalBase = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (parseFloat(r.base_amount) || 0), 0);
  }, [filteredRecords]);

  const totalGST = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (parseFloat(r.gst_amount) || 0), 0);
  }, [filteredRecords]);

  // Action Button 1: [Export Excel]
  const handleExportExcel = () => {
    const headers = ['PO Number', 'PO Date', 'Delivery Site', 'Vendor Name', 'Material Summary', 'Category', 'Base Amount (INR)', 'GST Amount (INR)', 'Total Amount (INR)', 'Status'];
    const rows = filteredRecords.map(r => [
      `"${r.po_no}"`,
      `"${r.po_date}"`,
      `"${r.site_name}"`,
      `"${r.vendor_name}"`,
      `"${r.material_summary}"`,
      `"${r.category}"`,
      r.base_amount,
      r.gst_amount,
      r.amount,
      `"${r.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Register_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action Button 2: [Export PDF]
  const handleExportPDF = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return <span className="badge badge-success">Approved</span>;
    if (s === 'open') return <span className="badge badge-info">Open</span>;
    if (s === 'partial') return <span className="badge badge-warning">Partial</span>;
    if (s === 'closed') return <span className="badge badge-default">Closed</span>;
    if (s === 'cancelled') return <span className="badge badge-danger">Cancelled</span>;
    return <span className="badge badge-default">{status}</span>;
  };

  return (
    <div className="purchase-register-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .purchase-register-container, .purchase-register-container * { visibility: visible; }
          .purchase-register-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          table { font-size: 10px !important; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate('/reports')}
              className="no-print btn btn-sm btn-ghost"
              style={{ fontSize: '0.85rem' }}
            >
              ← Back to Reports Hub
            </button>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📑</span> Purchase Register (Screen 16)
            </h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Official procurement ledger, GST input tax credits, vendor purchase totals & audit records.
          </p>
        </div>

        {/* Action buttons: [Export Excel], [Export PDF] */}
        <div className="no-print" style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>📊</span> Export Excel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>📄</span> Export PDF
          </button>
        </div>
      </div>

      {/* ── Screen 16: Filters Bar (Date Range From - To, Site, Vendor, Material) ── */}
      <div className="card no-print" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Site Filter</label>
            <select className="form-control" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="">All Sites</option>
              {sites.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Vendor Filter</label>
            <select className="form-control" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
              <option value="">All Vendors</option>
              {vendors.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Material Filter</label>
            <select className="form-control" value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}>
              <option value="">All Materials</option>
              {materials.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFromDate('2026-08-01');
                setToDate(dayjs().format('YYYY-MM-DD'));
                setSiteFilter('');
                setVendorFilter('');
                setMaterialFilter('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Screen 16: Table with PO No, Date, Site, Vendor, Amount, Status ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
              Procurement Register Ledger
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 10 }}>
              (Period: {dayjs(fromDate).format('DD MMM YYYY')} to {dayjs(toDate).format('DD MMM YYYY')})
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing {filteredRecords.length} records
          </span>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>PO No</th>
                <th>Date</th>
                <th>Site</th>
                <th>Vendor</th>
                <th>Material Details</th>
                <th style={{ textAlign: 'right' }}>Taxable Base</th>
                <th style={{ textAlign: 'right' }}>GST</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{item.po_no}</span>
                  </td>
                  <td>{dayjs(item.po_date).format('DD MMM YYYY')}</td>
                  <td>
                    <div style={{ fontSize: '0.83rem', color: '#334155' }}>{item.site_name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.vendor_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{item.material_summary}</div>
                    <span className="badge badge-default" style={{ fontSize: '0.68rem', marginTop: 2 }}>{item.category}</span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>
                    {formatINR(item.base_amount)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>
                    {formatINR(item.gst_amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                      {formatINR(item.amount)}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    No purchase register entries found matching your selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          SCREEN 16 EXPLICIT REQUIREMENT: Bottom summary: Total Purchase: ₹14,40,000
      ═════════════════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PURCHASE REGISTER AUDIT SUMMARY
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 4 }}>
              Total Orders: <strong>{filteredRecords.length}</strong> | Taxable Base: <strong>{formatINR(totalBase)}</strong> | Total GST: <strong>{formatINR(totalGST)}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Purchase:</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.02em', marginTop: 2 }}>
              {formatINR(totalPurchase)}
            </div>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div style={{ display: 'none' }} className="print-only">
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: '#64748b' }}>
          SiteTrack Construction ERP — Purchase Register generated on {dayjs().format('DD MMM YYYY, HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default PurchaseRegister;
