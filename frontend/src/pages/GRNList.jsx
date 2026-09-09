import React, { useState, useEffect, useMemo } from 'react';
import { getPOs, createGRN } from '../api/procurement';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

// Initial realistic Indian construction GRN records
const INITIAL_GRNS = [
  {
    id: 'grn-1',
    grn_no: 'GRN-2026-0031',
    po_no: 'PO-2026-0841',
    po_id: 'po-101',
    vendor_name: 'UltraTech Cement Ltd',
    site_name: 'Tower A - Expressway Project',
    site_id: 's-1',
    receipt_date: '2026-09-08',
    status: 'Accepted',
    vehicle_no: 'MH-14-BT-8921',
    driver_name: 'Harish Yadav',
    invoice_no: 'INV-UTC-9042',
    challan_no: 'DC-UTC-8821',
    qc_checks: {
      quantity_checked: true,
      quality_checked: true,
      packaging_checked: true,
      documents_checked: true
    },
    remarks: 'Weighbridge slip matches DC. Bag count 1000 nos intact without moisture damage.',
    items: [
      { material_name: 'UltraTech 53 Grade Cement', ordered_qty: 1000, received_qty: 1000, accepted_qty: 1000, rejected_qty: 0, unit: 'Bags' }
    ]
  },
  {
    id: 'grn-2',
    grn_no: 'GRN-2026-0030',
    po_no: 'PO-2026-0843',
    po_id: 'po-103',
    vendor_name: 'RMC Readymix India',
    site_name: 'Tower A - Expressway Project',
    site_id: 's-1',
    receipt_date: '2026-09-07',
    status: 'Partial',
    vehicle_no: 'KA-01-MJ-3312',
    driver_name: 'Suresh Naik',
    invoice_no: 'INV-RMC-4412',
    challan_no: 'DC-RMC-1092',
    qc_checks: {
      quantity_checked: true,
      quality_checked: true,
      packaging_checked: true,
      documents_checked: true
    },
    remarks: 'Transit mixer batch 1 received. Slump test 125mm passed. Cube samples cast.',
    items: [
      { material_name: 'Ready Mix Concrete M25 Grade', ordered_qty: 65, received_qty: 35, accepted_qty: 35, rejected_qty: 0, unit: 'Cu.m' }
    ]
  },
  {
    id: 'grn-3',
    grn_no: 'GRN-2026-0029',
    po_no: 'PO-2026-0842',
    po_id: 'po-102',
    vendor_name: 'Tata Steel BSL Ltd',
    site_name: 'Metro Phase 2 - Station 4',
    site_id: 's-2',
    receipt_date: '2026-09-06',
    status: 'Accepted',
    vehicle_no: 'WB-02-AK-7711',
    driver_name: 'Dilip Singh',
    invoice_no: 'INV-TSL-7819',
    challan_no: 'DC-TSL-3341',
    qc_checks: {
      quantity_checked: true,
      quality_checked: true,
      packaging_checked: true,
      documents_checked: true
    },
    remarks: 'MTC certificate verified. Gross weighbridge weight verified at site scales.',
    items: [
      { material_name: 'Tata Tiscon TMT Fe550D Rebar 16mm', ordered_qty: 20, received_qty: 20, accepted_qty: 20, rejected_qty: 0, unit: 'MT' }
    ]
  },
  {
    id: 'grn-4',
    grn_no: 'GRN-2026-0028',
    po_no: 'PO-2026-0845',
    po_id: 'po-105',
    vendor_name: 'Jindal Steel & Power',
    site_name: 'Greenfield Highway Km 42',
    site_id: 's-4',
    receipt_date: '2026-09-05',
    status: 'Rejected',
    vehicle_no: 'CG-04-XY-1290',
    driver_name: 'Ram Lal',
    invoice_no: 'INV-JSP-1102',
    challan_no: 'DC-JSP-9921',
    qc_checks: {
      quantity_checked: true,
      quality_checked: false,
      packaging_checked: false,
      documents_checked: true
    },
    remarks: 'Excessive surface pitting and rust found due to open rain transit. MTC heat numbers mismatched. Material rejected at gate.',
    items: [
      { material_name: 'Tata Tiscon TMT Fe550D Rebar 12mm', ordered_qty: 12, received_qty: 12, accepted_qty: 0, rejected_qty: 12, unit: 'MT' }
    ]
  },
];

const GRNList = () => {
  const { user } = useAuth();
  const [grns, setGrns] = useState(INITIAL_GRNS);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Available POs for selection
  const [availablePOs, setAvailablePOs] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingGRN, setViewingGRN] = useState(null);
  const [printGRN, setPrintGRN] = useState(null);

  // Form State for Screen 12 (Create GRN)
  const initialCreateForm = {
    grn_no: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
    po_no: '',
    vendor_name: '',
    site_name: '',
    receipt_date: dayjs().format('YYYY-MM-DD'),
    vehicle_no: '',
    driver_name: '',
    invoice_no: '',
    challan_no: '',
    qc_checks: {
      quantity_checked: true,
      quality_checked: true,
      packaging_checked: true,
      documents_checked: true
    },
    remarks: 'All packages inspected at unloading yard. Material verified against delivery challan.',
    items: [
      {
        material_name: 'UltraTech 53 Grade Cement',
        ordered_qty: 500,
        received_qty: 500,
        accepted_qty: 500,
        rejected_qty: 0,
        unit: 'Bags'
      }
    ]
  };

  const [formData, setFormData] = useState(initialCreateForm);

  // Load POs from backend or fallback
  const loadData = async () => {
    setLoading(true);
    try {
      const poData = await getPOs();
      if (Array.isArray(poData) && poData.length > 0) {
        setAvailablePOs(poData);
      } else {
        // Fallback default PO options
        setAvailablePOs([
          {
            po_number: 'PO-2026-0841',
            vendor_name: 'UltraTech Cement Ltd',
            site_name: 'Tower A - Expressway Project',
            items: [{ material_name: 'UltraTech 53 Grade Cement', qty_ordered: 1000, unit: 'Bags' }]
          },
          {
            po_number: 'PO-2026-0842',
            vendor_name: 'Tata Steel BSL Ltd',
            site_name: 'Metro Phase 2 - Station 4',
            items: [{ material_name: 'Tata Tiscon TMT Fe550D Rebar 16mm', qty_ordered: 20, unit: 'MT' }]
          },
          {
            po_number: 'PO-2026-0843',
            vendor_name: 'RMC Readymix India',
            site_name: 'Tower A - Expressway Project',
            items: [{ material_name: 'Ready Mix Concrete M25 Grade', qty_ordered: 65, unit: 'Cu.m' }]
          },
          {
            po_number: 'PO-2026-0845',
            vendor_name: 'Jindal Steel & Power',
            site_name: 'Greenfield Highway Km 42',
            items: [{ material_name: 'Tata Tiscon TMT Fe550D Rebar 12mm', qty_ordered: 12, unit: 'MT' }]
          },
          {
            po_number: 'PO-2026-0847',
            vendor_name: 'Asian Paints Ltd',
            site_name: 'Prestige Tech Park - Phase 1',
            items: [{ material_name: 'Asian Paints Apex Ultima White', qty_ordered: 400, unit: 'Litres' }]
          }
        ]);
      }
    } catch (e) {
      // Use fallback
      setAvailablePOs([
        {
          po_number: 'PO-2026-0841',
          vendor_name: 'UltraTech Cement Ltd',
          site_name: 'Tower A - Expressway Project',
          items: [{ material_name: 'UltraTech 53 Grade Cement', qty_ordered: 1000, unit: 'Bags' }]
        },
        {
          po_number: 'PO-2026-0842',
          vendor_name: 'Tata Steel BSL Ltd',
          site_name: 'Metro Phase 2 - Station 4',
          items: [{ material_name: 'Tata Tiscon TMT Fe550D Rebar 16mm', qty_ordered: 20, unit: 'MT' }]
        },
        {
          po_number: 'PO-2026-0843',
          vendor_name: 'RMC Readymix India',
          site_name: 'Tower A - Expressway Project',
          items: [{ material_name: 'Ready Mix Concrete M25 Grade', qty_ordered: 65, unit: 'Cu.m' }]
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When PO is selected in Screen 12, auto-populate Vendor, Site & Items
  const handlePOSelect = (poNum) => {
    const selected = availablePOs.find(p => p.po_number === poNum);
    if (selected) {
      const itemsMapped = selected.items && selected.items.length > 0
        ? selected.items.map(it => ({
            material_name: it.material_name || it.name || 'Construction Material',
            ordered_qty: it.qty_ordered || it.qty || 100,
            received_qty: it.qty_ordered || it.qty || 100,
            accepted_qty: it.qty_ordered || it.qty || 100,
            rejected_qty: 0,
            unit: it.unit || 'Bags'
          }))
        : [
            {
              material_name: 'UltraTech 53 Grade Cement',
              ordered_qty: 500,
              received_qty: 500,
              accepted_qty: 500,
              rejected_qty: 0,
              unit: 'Bags'
            }
          ];

      setFormData(prev => ({
        ...prev,
        po_no: poNum,
        vendor_name: selected.vendor_name || 'Vendor',
        site_name: selected.site_name || 'Site Location',
        items: itemsMapped
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        po_no: poNum
      }));
    }
  };

  // Item field change
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const valNum = parseFloat(value) || 0;
    newItems[index][field] = valNum;

    if (field === 'received_qty') {
      newItems[index].accepted_qty = valNum;
      newItems[index].rejected_qty = 0;
    } else if (field === 'accepted_qty') {
      const rec = parseFloat(newItems[index].received_qty) || 0;
      newItems[index].rejected_qty = Math.max(0, rec - valNum);
    } else if (field === 'rejected_qty') {
      const rec = parseFloat(newItems[index].received_qty) || 0;
      newItems[index].accepted_qty = Math.max(0, rec - valNum);
    }

    setFormData({ ...formData, items: newItems });
  };

  // Handle Quality Checks toggle
  const handleQCToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      qc_checks: {
        ...prev.qc_checks,
        [key]: !prev.qc_checks[key]
      }
    }));
  };

  // Save GRN / Accept GRN (Screen 12 Actions)
  const handleSaveGRN = async (isAccept = true) => {
    if (!formData.po_no) {
      setAlert({ type: 'error', message: 'Please select a Purchase Order.' });
      return;
    }
    if (!formData.vehicle_no) {
      setAlert({ type: 'error', message: 'Vehicle number is required for gate inward verification.' });
      return;
    }

    // Determine status: Accepted, Partial, or Rejected
    let computedStatus = isAccept ? 'Accepted' : 'Draft';
    if (isAccept) {
      const totalOrdered = formData.items.reduce((s, i) => s + (parseFloat(i.ordered_qty) || 0), 0);
      const totalAccepted = formData.items.reduce((s, i) => s + (parseFloat(i.accepted_qty) || 0), 0);
      const totalRejected = formData.items.reduce((s, i) => s + (parseFloat(i.rejected_qty) || 0), 0);

      if (totalAccepted === 0 && totalRejected > 0) {
        computedStatus = 'Rejected';
      } else if (totalAccepted < totalOrdered) {
        computedStatus = 'Partial';
      } else {
        computedStatus = 'Accepted';
      }
    }

    const newRecord = {
      id: `grn-${Date.now()}`,
      grn_no: formData.grn_no,
      po_no: formData.po_no,
      vendor_name: formData.vendor_name || 'Vendor',
      site_name: formData.site_name || 'Site',
      receipt_date: formData.receipt_date,
      status: computedStatus,
      vehicle_no: formData.vehicle_no,
      driver_name: formData.driver_name,
      invoice_no: formData.invoice_no || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      challan_no: formData.challan_no || `DC-${Math.floor(1000 + Math.random() * 9000)}`,
      qc_checks: formData.qc_checks,
      remarks: formData.remarks,
      items: formData.items
    };

    // Try backend call
    try {
      await createGRN({
        po_id: formData.po_no,
        received_date: formData.receipt_date,
        items: formData.items.map(i => ({
          qty_received: i.received_qty,
          remarks: formData.remarks
        }))
      });
    } catch (e) {
      // Handled locally
    }

    setGrns([newRecord, ...grns]);
    setShowCreateModal(false);

    if (computedStatus === 'Accepted' || computedStatus === 'Partial') {
      setAlert({
        type: 'success',
        message: `GRN ${newRecord.grn_no} accepted successfully! ${formData.items.map(i => `${i.accepted_qty} ${i.unit} of ${i.material_name}`).join(', ')} visually credited to Site Stock inventory.`
      });
    } else {
      setAlert({
        type: 'success',
        message: `GRN ${newRecord.grn_no} recorded as ${computedStatus}.`
      });
    }
  };

  // Filtered GRNs
  const filteredGRNs = useMemo(() => {
    return grns.filter(g => {
      const matchSite = !siteFilter || g.site_name.toLowerCase().includes(siteFilter.toLowerCase());
      const matchStatus = !statusFilter || g.status.toLowerCase() === statusFilter.toLowerCase();
      const matchSearch = !searchTerm ||
        g.grn_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.po_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.vehicle_no && g.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSite && matchStatus && matchSearch;
    });
  }, [grns, siteFilter, statusFilter, searchTerm]);

  // Unique sites for filter
  const uniqueSites = useMemo(() => {
    return Array.from(new Set(grns.map(g => g.site_name))).filter(Boolean);
  }, [grns]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return <span className="badge badge-success">Accepted</span>;
    if (s === 'partial') return <span className="badge badge-warning">Partial</span>;
    if (s === 'rejected') return <span className="badge badge-danger">Rejected</span>;
    return <span className="badge badge-default">{status}</span>;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📥</span> Goods Receipt Note (GRN)
          </h1>
          <p className="page-subtitle">Screen 11 & 12: Material gate inward receipts, physical weighbridge inspection & inventory acceptance.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                ...initialCreateForm,
                grn_no: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`
              });
              setShowCreateModal(true);
            }}
          >
            + Create GRN
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            backgroundColor: alert.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: alert.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{alert.type === 'error' ? '⚠️' : '✅'} {alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* ── KPI Cards (Screen 11 Top Summary) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL GATE INWARDS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>{grns.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: 4 }}>Recorded delivery challans</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ACCEPTED & STOCKED</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {grns.filter(g => g.status === 'Accepted').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>QC passed, credited to store</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PARTIAL RECEIPTS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            {grns.filter(g => g.status === 'Partial').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Awaiting pending shipment</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>REJECTED DISCREPANCIES</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            {grns.filter(g => g.status === 'Rejected').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Failed quality inspection</div>
        </div>
      </div>

      {/* ── Filter Bar (Screen 11) ── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Search GRN / PO / Vehicle</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. GRN-2026, PO-2026, MH-14..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Site Location</label>
            <select className="form-control" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="">All Sites</option>
              {uniqueSites.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Status</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Accepted">Accepted</option>
              <option value="Partial">Partial</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchTerm(''); setSiteFilter(''); setStatusFilter(''); }}
            >
              Reset Filters
            </button>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Table (Screen 11 List View) ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div style={{ color: '#64748b' }}>Loading goods receipt notes...</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Delivery Site</th>
                  <th>Receipt Date</th>
                  <th>Vehicle / Driver</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGRNs.map(grn => (
                  <tr key={grn.id}>
                    <td>
                      <span
                        style={{ fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                        onClick={() => setViewingGRN(grn)}
                        title="View inspection details"
                      >
                        {grn.grn_no}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>DC: {grn.challan_no}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{grn.po_no}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{grn.vendor_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>{grn.site_name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{dayjs(grn.receipt_date).format('DD MMM YYYY')}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{grn.vehicle_no || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{grn.driver_name || 'Driver'}</div>
                    </td>
                    <td>
                      {getStatusBadge(grn.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setViewingGRN(grn)}
                          title="View Inspection Slip"
                          style={{ padding: '4px 8px' }}
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setPrintGRN(grn)}
                          title="Print Challan Slip"
                          style={{ padding: '4px 8px' }}
                        >
                          📄 Challan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGRNs.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      No GRN records match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          SCREEN 12: CREATE GRN VIEW / MODAL
      ═════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Goods Receipt Note (Screen 12)"
        subtitle="Record physical shipment arrival, inspect quality parameters, and update inventory."
        icon="📥"
        size="xl"
      >
        <div>
          {/* Header Row: GRN No */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>GRN Identifier:</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{formData.grn_no}</span>
            </div>
            <span className="badge badge-info">Gate Receipt Status: Pending Inspection</span>
          </div>

          {/* Section 1: PO & Logistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Select Purchase Order *</label>
              <select
                className="form-control"
                value={formData.po_no}
                onChange={e => handlePOSelect(e.target.value)}
                required
              >
                <option value="">-- Choose PO --</option>
                {availablePOs.map((p, idx) => (
                  <option key={idx} value={p.po_number}>
                    {p.po_number} — {p.vendor_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Vendor (Auto-populated)</label>
              <input
                type="text"
                className="form-control"
                value={formData.vendor_name}
                readOnly
                placeholder="Auto-populated from PO"
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>

            <div>
              <label className="form-label">Delivery Site (Auto-populated)</label>
              <input
                type="text"
                className="form-control"
                value={formData.site_name}
                readOnly
                placeholder="Auto-populated from PO"
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>

            <div>
              <label className="form-label">Receipt Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.receipt_date}
                onChange={e => setFormData({ ...formData, receipt_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Vehicle No *</label>
              <input
                type="text"
                className="form-control"
                value={formData.vehicle_no}
                onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })}
                placeholder="e.g. MH-12-AB-4521"
                required
              />
            </div>

            <div>
              <label className="form-label">Driver Name & Phone</label>
              <input
                type="text"
                className="form-control"
                value={formData.driver_name}
                onChange={e => setFormData({ ...formData, driver_name: e.target.value })}
                placeholder="e.g. Ramesh Kumar (9876543210)"
              />
            </div>

            <div>
              <label className="form-label">Supplier Invoice No</label>
              <input
                type="text"
                className="form-control"
                value={formData.invoice_no}
                onChange={e => setFormData({ ...formData, invoice_no: e.target.value })}
                placeholder="e.g. INV-UTC-9921"
              />
            </div>

            <div>
              <label className="form-label">Delivery Challan No</label>
              <input
                type="text"
                className="form-control"
                value={formData.challan_no}
                onChange={e => setFormData({ ...formData, challan_no: e.target.value })}
                placeholder="e.g. DC-2026-5541"
              />
            </div>
          </div>

          {/* Section 2: Items Table (Screen 12 explicit fields) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem', marginBottom: 8 }}>
              📋 Items Breakdown: Ordered vs. Received & Acceptance
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Material</th>
                    <th style={{ width: 110 }}>Ordered Qty</th>
                    <th style={{ width: 110 }}>Received Qty</th>
                    <th style={{ width: 110 }}>Accepted Qty</th>
                    <th style={{ width: 110 }}>Rejected Qty</th>
                    <th style={{ width: 80 }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.82rem' }}
                          value={item.material_name}
                          onChange={e => {
                            const copy = [...formData.items];
                            copy[idx].material_name = e.target.value;
                            setFormData({ ...formData, items: copy });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ fontSize: '0.82rem', backgroundColor: '#f8fafc' }}
                          value={item.ordered_qty}
                          onChange={e => handleItemChange(idx, 'ordered_qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ fontSize: '0.82rem', fontWeight: 600 }}
                          value={item.received_qty}
                          onChange={e => handleItemChange(idx, 'received_qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}
                          value={item.accepted_qty}
                          onChange={e => handleItemChange(idx, 'accepted_qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 700 }}
                          value={item.rejected_qty}
                          onChange={e => handleItemChange(idx, 'rejected_qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.82rem' }}
                          value={item.unit}
                          onChange={e => {
                            const copy = [...formData.items];
                            copy[idx].unit = e.target.value;
                            setFormData({ ...formData, items: copy });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Quality Check Checkboxes (Screen 12 explicit requirement) */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
              🛡️ Quality & Gate Inward Verification Checklist
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.qc_checks.quantity_checked}
                  onChange={() => handleQCToggle('quantity_checked')}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span><strong>Quantity Checked:</strong> Physical weighbridge / count</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.qc_checks.quality_checked}
                  onChange={() => handleQCToggle('quality_checked')}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span><strong>Quality Checked:</strong> Test certificate / slump passed</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.qc_checks.packaging_checked}
                  onChange={() => handleQCToggle('packaging_checked')}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span><strong>Packaging Checked:</strong> Bags intact & dry, no leakage</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.qc_checks.documents_checked}
                  onChange={() => handleQCToggle('documents_checked')}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span><strong>Documents Checked:</strong> Invoice, DC & MTC verified</span>
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Gate Inward Remarks & Inspection Observations</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Record any physical deviations, seal numbers, or unloading bay assignment..."
            />
          </div>

          {/* Screen 12 Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSaveGRN(false)}
            >
              💾 Save Draft
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => handleSaveGRN(true)}
            >
              ✅ Accept GRN & Update Stock
            </button>
          </div>
        </div>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════
          GRN INSPECTION VIEW MODAL
      ═════════════════════════════════════════════════════════════════ */}
      {viewingGRN && (
        <Modal
          isOpen={!!viewingGRN}
          onClose={() => setViewingGRN(null)}
          title={`GRN Details: ${viewingGRN.grn_no}`}
          subtitle={`Goods Receipt against Purchase Order ${viewingGRN.po_no}`}
          icon="📦"
          size="lg"
        >
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>VENDOR</span>
                <div style={{ fontWeight: 700 }}>{viewingGRN.vendor_name}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>DELIVERY SITE</span>
                <div style={{ fontWeight: 700 }}>{viewingGRN.site_name}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>DATE RECEIVED</span>
                <div style={{ fontWeight: 600 }}>{dayjs(viewingGRN.receipt_date).format('DD MMMM YYYY')}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>VEHICLE & DRIVER</span>
                <div style={{ fontWeight: 600 }}>{viewingGRN.vehicle_no || '—'} ({viewingGRN.driver_name || 'Driver'})</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Material Receipt Breakdown</div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Accepted</th>
                      <th>Rejected</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingGRN.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{it.material_name}</td>
                        <td>{it.ordered_qty}</td>
                        <td style={{ fontWeight: 600 }}>{it.received_qty}</td>
                        <td style={{ color: '#16a34a', fontWeight: 700 }}>{it.accepted_qty}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{it.rejected_qty}</td>
                        <td>{it.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quality Check Status */}
            <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Quality Check Verification:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>{viewingGRN.qc_checks?.quantity_checked ? '✅' : '❌'} Quantity Verified (Weighbridge/Count)</div>
                <div>{viewingGRN.qc_checks?.quality_checked ? '✅' : '❌'} Quality Passed (IS Spec / Slump Test)</div>
                <div>{viewingGRN.qc_checks?.packaging_checked ? '✅' : '❌'} Packaging Intact</div>
                <div>{viewingGRN.qc_checks?.documents_checked ? '✅' : '❌'} Challan & MTC Verified</div>
              </div>
              {viewingGRN.remarks && (
                <div style={{ marginTop: 8, fontStyle: 'italic', color: '#475569' }}>
                  Inspector Remarks: {viewingGRN.remarks}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setViewingGRN(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const target = viewingGRN;
                  setViewingGRN(null);
                  setPrintGRN(target);
                }}
              >
                📄 Print Goods Receipt Challan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          PRINT CHALLAN / PDF MODAL
      ═════════════════════════════════════════════════════════════════ */}
      {printGRN && (
        <Modal
          isOpen={!!printGRN}
          onClose={() => setPrintGRN(null)}
          title={`Gate Inward Receipt: ${printGRN.grn_no}`}
          subtitle="Official Gate Inward Material Delivery Note"
          icon="🖨️"
          size="lg"
        >
          <div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '24px',
                borderRadius: '6px',
                color: '#0f172a'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e293b', paddingBottom: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>SITETRACK ERP — MATERIAL INWARD SLIP</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>Site Material Store & Gate Verification Report</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>{printGRN.grn_no}</div>
                  <div style={{ fontSize: '0.78rem' }}>Date: {dayjs(printGRN.receipt_date).format('DD MMM YYYY')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, fontSize: '0.84rem' }}>
                <div>
                  <div><strong>PO Reference:</strong> {printGRN.po_no}</div>
                  <div><strong>Vendor:</strong> {printGRN.vendor_name}</div>
                  <div><strong>Supplier Invoice:</strong> {printGRN.invoice_no || 'Attached'}</div>
                  <div><strong>Delivery Challan:</strong> {printGRN.challan_no || 'Attached'}</div>
                </div>
                <div>
                  <div><strong>Delivery Site:</strong> {printGRN.site_name}</div>
                  <div><strong>Vehicle Number:</strong> {printGRN.vehicle_no || 'Direct'}</div>
                  <div><strong>Driver Name:</strong> {printGRN.driver_name || 'Authorized'}</div>
                  <div><strong>Inspection Status:</strong> {printGRN.status}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Item</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Ordered</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Received</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Accepted</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Rejected</th>
                    <th style={{ padding: 8, textAlign: 'left' }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {(printGRN.items || []).map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 8, fontWeight: 600 }}>{it.material_name}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{it.ordered_qty}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{it.received_qty}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{it.accepted_qty}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{it.rejected_qty}</td>
                      <td style={{ padding: 8 }}>{it.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, paddingTop: 40, fontSize: '0.75rem', textAlign: 'center' }}>
                <div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4 }}>Driver / Carrier Signature</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4 }}>Gate Security Officer</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4 }}>Store Incharge / QC Eng</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setPrintGRN(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Receipt Slip</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GRNList;
