import React, { useState, useEffect, useMemo } from 'react';
import { getPOs, createPO, updatePOStatus, getPRs } from '../api/procurement';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

// Format Currency: AED 14,400
const formatAED = (amount) => {
  const num = Number(amount) || 0;
  return `AED ${num.toLocaleString()}`;
};

const PurchaseOrders = () => {
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filter States
  const [vendorFilter, setVendorFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingPO, setViewingPO] = useState(null);
  const [pdfPO, setPdfPO] = useState(null);

  // Master Data
  const [vendors, setVendors] = useState([]);
  const [sites, setSites] = useState([]);
  const [prs, setPRs] = useState([]);
  const [materialCatalog, setMaterialCatalog] = useState([]);

  // Form Data for Create PO (Screen 9)
  const initialForm = {
    po_number: `PO-${dayjs().format('YYYY')}-${Math.floor(1000 + Math.random() * 9000)}`,
    vendor_id: '',
    site_id: '',
    mr_ref: '',
    po_date: dayjs().format('YYYY-MM-DD'),
    delivery_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    payment_terms: '30 Days Net',
    terms: 'Materials must strictly adhere to specifications. Delivery challan and invoice required on arrival.',
    items: [
      {
        material_name: '',
        description: '',
        qty: 1,
        unit: 'Nos',
        unit_price: 0,
        gst_percent: 18,
        total: 0
      }
    ]
  };

  const [formData, setFormData] = useState(initialForm);

  // Load from API
  const loadData = async () => {
    setLoading(true);
    try {
      const [poRes, prRes, vRes, sRes, mRes] = await Promise.allSettled([
        getPOs(),
        getPRs(),
        apiClient.get('/vendors'),
        apiClient.get('/sites'),
        apiClient.get('/materials'),
      ]);

      if (poRes.status === 'fulfilled') {
        const raw = poRes.value?.data?.data?.data || poRes.value?.data?.data || poRes.value?.data || poRes.value || [];
        if (Array.isArray(raw)) {
          const merged = raw.map(p => ({
            ...p,
            id: p.id,
            po_number: p.po_number || `PO-${p.id?.slice(0, 6)}`,
            status: p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase().replace('_', ' ')) : 'Open',
            delivery_date: p.delivery_date || (p.po_date ? dayjs(p.po_date).add(7, 'day').format('YYYY-MM-DD') : '-'),
            vendor_name: p.vendor_name || '-',
            site_name: p.site_name || '-',
            total_amount: parseFloat(p.total_amount) || 0,
            items: Array.isArray(p.items) ? p.items : []
          }));
          setPOs(merged);
        }
      }

      if (prRes.status === 'fulfilled') {
        const rawPr = prRes.value?.data?.data?.data || prRes.value?.data?.data || prRes.value?.data || prRes.value || [];
        if (Array.isArray(rawPr)) setPRs(rawPr);
      }
      if (vRes.status === 'fulfilled') {
        const rawV = vRes.value?.data?.data?.data || vRes.value?.data?.data || vRes.value?.data || [];
        if (Array.isArray(rawV)) setVendors(rawV);
      }
      if (sRes.status === 'fulfilled') {
        const rawS = sRes.value?.data?.data?.data || sRes.value?.data?.data || sRes.value?.data || [];
        if (Array.isArray(rawS)) {
          setSites(rawS.map(s => ({ id: s.id, site_name: s.name || s.site_name, address: s.location || s.emirate || s.address })));
        }
      }
      if (mRes.status === 'fulfilled') {
        const rawM = mRes.value?.data?.materials || mRes.value?.data?.data || mRes.value?.data || [];
        if (Array.isArray(rawM)) {
          const mapped = rawM.map(m => ({
            id: m.id,
            name: m.name || m.material_name,
            defaultUnit: m.unit_of_measure || m.unit || 'Nos',
            defaultPrice: parseFloat(m.standard_rate || m.unit_price) || 0,
            gstRate: 18,
            description: m.description || m.category || ''
          }));
          setMaterialCatalog(mapped);
        }
      }
    } catch (e) {
      console.warn('API fetch warning:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Purchase Orders
  const filteredPOs = useMemo(() => {
    return pos.filter(po => {
      const matchVendor = !vendorFilter || (po.vendor_name && po.vendor_name.toLowerCase().includes(vendorFilter.toLowerCase()));
      const matchSite = !siteFilter || (po.site_name && po.site_name.toLowerCase().includes(siteFilter.toLowerCase()));
      const matchStatus = !statusFilter || (po.status && po.status.toLowerCase() === statusFilter.toLowerCase());
      const matchSearch = !searchTerm ||
        (po.po_number && po.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.vendor_name && po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.site_name && po.site_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchVendor && matchSite && matchStatus && matchSearch;
    });
  }, [pos, vendorFilter, siteFilter, statusFilter, searchTerm]);

  // KPIs
  const totalPOValue = useMemo(() => pos.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0), [pos]);
  const pendingCount = useMemo(() => pos.filter(p => p.status === 'Open' || p.status === 'Draft').length, [pos]);
  const approvedCount = useMemo(() => pos.filter(p => p.status === 'Approved').length, [pos]);
  const partialCount = useMemo(() => pos.filter(p => p.status === 'Partial').length, [pos]);

  // Screen 9 Item Management
  const handleAddItem = () => {
    const first = materialCatalog[0];
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          material_name: first.name,
          description: first.description || '',
          qty: 1,
          unit: first.defaultUnit,
          unit_price: first.defaultPrice,
          gst_percent: first.gstRate || 18,
          total: Math.round(first.defaultPrice * (1 + (first.gstRate || 18) / 100))
        }
      ]
    }));
  };

  const handleMaterialChange = (index, matName) => {
    const selected = materialCatalog.find(m => m.name === matName) || {};
    const newItems = [...formData.items];
    const qty = parseFloat(newItems[index].qty) || 1;
    const price = selected.defaultPrice || newItems[index].unit_price || 0;
    const gst = selected.gstRate !== undefined ? selected.gstRate : 18;
    const total = Math.round(qty * price * (1 + gst / 100));

    newItems[index] = {
      ...newItems[index],
      material_name: matName,
      unit: selected.defaultUnit || newItems[index].unit || 'Nos',
      unit_price: price,
      gst_percent: gst,
      description: selected.description || newItems[index].description || '',
      total
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleItemFieldChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].unit_price) || 0;
    const gst = parseFloat(newItems[index].gst_percent) || 0;
    newItems[index].total = Math.round(qty * price * (1 + gst / 100));

    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      alert('At least one item is required in the PO.');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Calculations for Screen 9
  const subtotal = useMemo(() => {
    return formData.items.reduce((acc, item) => acc + (parseFloat(item.qty || 0) * parseFloat(item.unit_price || 0)), 0);
  }, [formData.items]);

  const totalGST = useMemo(() => {
    return formData.items.reduce((acc, item) => {
      const base = parseFloat(item.qty || 0) * parseFloat(item.unit_price || 0);
      const gst = parseFloat(item.gst_percent || 0);
      return acc + (base * gst / 100);
    }, 0);
  }, [formData.items]);

  const grandTotal = useMemo(() => Math.round(subtotal + totalGST), [subtotal, totalGST]);

  // Create PO Handler
  const handleSavePO = async (statusToSet = 'Approved') => {
    if (!formData.vendor_id) {
      setAlert({ type: 'error', message: 'Please select a vendor.' });
      return;
    }
    if (!formData.site_id) {
      setAlert({ type: 'error', message: 'Please select a delivery site.' });
      return;
    }
    if (formData.items.length === 0) {
      setAlert({ type: 'error', message: 'Please add at least one material item.' });
      return;
    }

    const selectedVendor = vendors.find(v => v.id === formData.vendor_id) || { vendor_name: 'Selected Vendor' };
    const selectedSite = sites.find(s => s.id === formData.site_id) || { site_name: 'Selected Site' };

    const newPO = {
      id: `po-${Date.now()}`,
      po_number: formData.po_number,
      po_date: formData.po_date,
      delivery_date: formData.delivery_date,
      vendor_name: selectedVendor.vendor_name || selectedVendor.name,
      vendor_id: formData.vendor_id,
      site_name: selectedSite.site_name || selectedSite.name,
      site_id: formData.site_id,
      payment_terms: formData.payment_terms,
      mr_ref: formData.mr_ref || '-- Direct PO --',
      status: statusToSet,
      total_amount: grandTotal,
      subtotal: Math.round(subtotal),
      tax_amount: Math.round(totalGST),
      items: formData.items,
      terms: formData.terms
    };

    try {
      await createPO({
        vendor_id: formData.vendor_id,
        delivery_site_id: formData.site_id,
        po_date: formData.po_date,
        items: formData.items.map(i => ({
          material_id: i.material_id || 'mat-1',
          qty_ordered: i.qty,
          unit_price: i.unit_price,
        }))
      });
    } catch (e) {
      // Handled locally
    }

    setPOs([newPO, ...pos]);
    setShowCreateModal(false);
    setFormData(initialForm);
    setAlert({ type: 'success', message: `Purchase Order ${newPO.po_number} created with status '${statusToSet}' successfully.` });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePOStatus(id, newStatus.toLowerCase());
    } catch (e) {
      // Local fallback
    }
    setPOs(pos.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (viewingPO && viewingPO.id === id) {
      setViewingPO(prev => ({ ...prev, status: newStatus }));
    }
    setAlert({ type: 'success', message: `PO status updated to ${newStatus}` });
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🛒</span> Purchase Orders
          </h1>
          <p className="page-subtitle">Screen 8 & 9: Create and track procurement POs, supplier contracts, GST invoices & delivery fulfillment.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                ...initialForm,
                po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`
              });
              setShowCreateModal(true);
            }}
          >
            + Create PO
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

      {/* ── KPI Cards (Screen 8 Top Summary) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL PO VALUE</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>{formatAED(totalPOValue)}</div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: 4 }}>Across {pos.length} procurement orders</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PENDING APPROVAL / DRAFT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Requires PM sign-off</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>APPROVED & IN-TRANSIT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Awaiting delivery / GRN</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PARTIAL DELIVERIES</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>{partialCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Balance dispatch expected</div>
        </div>
      </div>

      {/* ── Filters Bar (Screen 8) ── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Search Orders</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search PO #, Vendor, Site..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Vendor</label>
            <select className="form-control" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
              <option value="">All Vendors</option>
              {vendors.map(v => (
                <option key={v.id} value={v.vendor_name || v.name}>{v.vendor_name || v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Site / Project</label>
            <select className="form-control" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="">All Sites</option>
              {sites.map(s => (
                <option key={s.id} value={s.site_name || s.name}>{s.site_name || s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Status</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Open">Open</option>
              <option value="Partial">Partial</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setVendorFilter(''); setSiteFilter(''); setStatusFilter(''); setSearchTerm(''); }}
            >
              Reset
            </button>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Screen 8: PO Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div style={{ color: '#64748b' }}>Loading purchase orders...</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>PO Date</th>
                  <th>Vendor</th>
                  <th>Delivery Site</th>
                  <th>Amount</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <span
                        style={{ fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                        onClick={() => setViewingPO(po)}
                        title="Click to view details"
                      >
                        {po.po_number}
                      </span>
                      {po.mr_ref && po.mr_ref !== '-- Direct PO --' && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ref: {po.mr_ref.split(' ')[0]}</div>
                      )}
                    </td>
                    <td>{dayjs(po.po_date).format('DD MMM YYYY')}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{po.vendor_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>{po.site_name}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {formatAED(po.total_amount)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {po.delivery_date ? dayjs(po.delivery_date).format('DD MMM YYYY') : '—'}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(po.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setViewingPO(po)}
                          title="View PO Details"
                          style={{ padding: '4px 8px' }}
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setPdfPO(po)}
                          title="Generate / Print PDF"
                          style={{ padding: '4px 8px' }}
                        >
                          📄 PDF
                        </button>
                        {po.status === 'Open' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleStatusChange(po.id, 'Approved')}
                            title="Approve PO"
                            style={{ padding: '4px 8px' }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {po.status === 'Approved' && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleStatusChange(po.id, 'Closed')}
                            title="Mark Closed"
                            style={{ padding: '4px 8px' }}
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      No purchase orders match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          SCREEN 9: CREATE PO MODAL (Comprehensive & Dynamic Table)
      ═════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Purchase Order (Screen 9)"
        subtitle="Issue vendor procurement contract with tax calculations and delivery terms."
        icon="🛒"
        size="xl"
      >
        <div>
          {/* Header Row: PO # & Status Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Generated PO Number:</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{formData.po_number}</span>
            </div>
            <span className="badge badge-info">Status: Draft / Pending</span>
          </div>

          {/* Primary Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Vendor *</label>
              <select
                className="form-control"
                value={formData.vendor_id}
                onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
                required
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name || v.name} {v.city ? `(${v.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Delivery Site *</label>
              <select
                className="form-control"
                value={formData.site_id}
                onChange={e => setFormData({ ...formData, site_id: e.target.value })}
                required
              >
                <option value="">-- Select Site --</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.site_name || s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Material Request Ref (Optional)</label>
              <select
                className="form-control"
                value={formData.mr_ref}
                onChange={e => setFormData({ ...formData, mr_ref: e.target.value })}
              >
                <option value="">-- Direct PO (No PR) --</option>
                {prs.map(p => (
                  <option key={p.id} value={`${p.pr_number} - ${p.project_name || 'Site'}`}>
                    {p.pr_number} ({p.project_name || p.requested_by_name || 'PR'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">PO Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.po_date}
                onChange={e => setFormData({ ...formData, po_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Required Delivery Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.delivery_date}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Payment Terms *</label>
              <select
                className="form-control"
                value={formData.payment_terms}
                onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
              >
                <option value="30 Days Net">30 Days Net</option>
                <option value="15 Days Net">15 Days Net</option>
                <option value="Immediate / Advance">Immediate / Advance</option>
                <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                <option value="LC 60 Days">Letter of Credit (LC) 60 Days</option>
              </select>
            </div>
          </div>

          {/* Dynamic Items Table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                📦 PO Items & Bill of Quantities
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleAddItem}
              >
                + Add Item
              </button>
            </div>

            <div className="table-responsive" style={{ maxHeight: '280px' }}>
              <table style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Material</th>
                    <th style={{ minWidth: 160 }}>Description</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 80 }}>Unit</th>
                    <th style={{ width: 110 }}>Unit Price (AED)</th>
                    <th style={{ width: 90 }}>VAT %</th>
                    <th style={{ width: 120 }}>Total (AED)</th>
                    <th style={{ width: 50, textAlign: 'center' }}>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                          value={item.material_name}
                          onChange={e => handleMaterialChange(idx, e.target.value)}
                        >
                          {materialCatalog.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                          value={item.description}
                          onChange={e => handleItemFieldChange(idx, 'description', e.target.value)}
                          placeholder="Specs / grade"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                          value={item.qty}
                          onChange={e => handleItemFieldChange(idx, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                          value={item.unit}
                          onChange={e => handleItemFieldChange(idx, 'unit', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                          value={item.unit_price}
                          onChange={e => handleItemFieldChange(idx, 'unit_price', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                          value={item.gst_percent}
                          onChange={e => handleItemFieldChange(idx, 'gst_percent', e.target.value)}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>
                        {formatAED(item.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                          title="Remove row"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal, GST & Grand Total Summary Box */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 16 }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Delivery Instructions & Terms</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.terms}
                onChange={e => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Mention gate timings, inspection requirements, unloading scope..."
              />
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Subtotal (Excl. Tax):</span>
                <span style={{ fontWeight: 600 }}>{formatAED(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Total GST (CGST + SGST):</span>
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatAED(totalGST)}</span>
              </div>
              <div style={{ height: 1, background: '#cbd5e1', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#16a34a' }}>{formatAED(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Screen 9 Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSavePO('Draft')}
            >
              💾 Save Draft
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const tempPO = {
                  ...formData,
                  id: 'temp-preview',
                  total_amount: grandTotal,
                  subtotal,
                  tax_amount: totalGST,
                  vendor_name: (vendors.find(v => v.id === formData.vendor_id) || {}).vendor_name || 'Sample Vendor',
                  site_name: (sites.find(s => s.id === formData.site_id) || {}).site_name || 'Sample Site',
                };
                setPdfPO(tempPO);
              }}
            >
              📄 Generate PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSavePO('Approved')}
            >
              🚀 Send for Approval
            </button>
          </div>
        </div>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════
          PO VIEW DETAILS MODAL
      ═════════════════════════════════════════════════════════════════ */}
      {viewingPO && (
        <Modal
          isOpen={!!viewingPO}
          onClose={() => setViewingPO(null)}
          title={`Purchase Order: ${viewingPO.po_number}`}
          subtitle={`Raised on ${dayjs(viewingPO.po_date).format('DD MMMM YYYY')}`}
          icon="📋"
          size="lg"
        >
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16 }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Vendor Details</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{viewingPO.vendor_name}</div>
                <div style={{ color: '#64748b', marginTop: 2 }}>Payment Terms: {viewingPO.payment_terms || '30 Days Net'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Delivery Location</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{viewingPO.site_name}</div>
                <div style={{ color: '#64748b', marginTop: 2 }}>
                  Delivery Date: {viewingPO.delivery_date ? dayjs(viewingPO.delivery_date).format('DD MMM YYYY') : 'TBD'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Order Items</div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>GST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingPO.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{it.material_name || it.name}</td>
                        <td style={{ color: '#64748b' }}>{it.description || 'Standard supply'}</td>
                        <td>{it.qty || it.qty_ordered} {it.unit}</td>
                        <td>{formatAED(it.unit_price)}</td>
                        <td>{it.gst_percent || 18}%</td>
                        <td style={{ fontWeight: 700 }}>{formatAED(it.total || (it.qty * it.unit_price * 1.18))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16 }}>
              <div>
                <span style={{ fontWeight: 600 }}>Status:</span> {getStatusBadge(viewingPO.status)}
                {viewingPO.terms && (
                  <div style={{ marginTop: 6, color: '#64748b', fontSize: '0.78rem' }}>
                    Note: {viewingPO.terms}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#64748b' }}>Grand Total (Inclusive of Tax):</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>
                  {formatAED(viewingPO.total_amount)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setViewingPO(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const target = viewingPO;
                  setViewingPO(null);
                  setPdfPO(target);
                }}
              >
                📄 Print / Export PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          PRINT / PDF PREVIEW MODAL (Professional Construction PO Layout)
      ═════════════════════════════════════════════════════════════════ */}
      {pdfPO && (
        <Modal
          isOpen={!!pdfPO}
          onClose={() => setPdfPO(null)}
          title={`Print Purchase Order: ${pdfPO.po_number}`}
          subtitle="Ready for printing or downloading as official document."
          icon="🖨️"
          size="lg"
        >
          <div>
            <div
              id="printable-po-document"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '24px',
                borderRadius: '6px',
                fontFamily: 'Inter, sans-serif',
                color: '#0f172a'
              }}
            >
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>SITETRACK ERP</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>Apex Infrastructure & Construction Ltd</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>CIN: L45200MH2008PLC189421 | GSTIN: 27AABCA1234F1Z1</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Expressway Corporate Tower, Sector 62, Noida, NCR</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>PURCHASE ORDER</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{pdfPO.po_number}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>Date: {dayjs(pdfPO.po_date).format('DD MMM YYYY')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>Delivery Due: {dayjs(pdfPO.delivery_date).format('DD MMM YYYY')}</div>
                </div>
              </div>

              {/* Vendor & Delivery Addresses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.85rem' }}>
                <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>SUPPLIER / VENDOR</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>{pdfPO.vendor_name}</div>
                  <div style={{ color: '#475569', marginTop: 2 }}>GSTIN: Registered Construction Vendor</div>
                  <div style={{ color: '#475569' }}>Payment Terms: {pdfPO.payment_terms || '30 Days Net'}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>DELIVERY SITE & CONSIGNEE</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>{pdfPO.site_name}</div>
                  <div style={{ color: '#475569', marginTop: 2 }}>Consignee: Site Incharge / Stores Manager</div>
                  <div style={{ color: '#475569' }}>Ref: {pdfPO.mr_ref || 'Direct Purchase'}</div>
                </div>
              </div>

              {/* Items List */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Unit</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>GST %</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(pdfPO.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px' }}>{idx + 1}</td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 600 }}>{it.material_name || it.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{it.description}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{it.qty || it.qty_ordered}</td>
                      <td style={{ padding: '8px' }}>{it.unit}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{Number(it.unit_price).toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{it.gst_percent || 18}%</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                        {Number(it.total || (it.qty * it.unit_price * 1.18)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '280px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>{formatAED(pdfPO.subtotal || (pdfPO.total_amount * 0.82))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#64748b' }}>GST Component:</span>
                    <span style={{ fontWeight: 600 }}>{formatAED(pdfPO.tax_amount || (pdfPO.total_amount * 0.18))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #cbd5e1', fontSize: '1.05rem', fontWeight: 800 }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#2563eb' }}>{formatAED(pdfPO.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', paddingTop: '30px', borderTop: '1px dashed #cbd5e1' }}>
                <div>
                  <div style={{ height: '35px' }}></div>
                  <div style={{ borderTop: '1px solid #94a3b8', width: '180px', fontSize: '0.75rem', fontWeight: 600 }}>
                    Prepared By: {user?.full_name || 'Procurement Mgr'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: '35px' }}></div>
                  <div style={{ borderTop: '1px solid #94a3b8', width: '180px', marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600 }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setPdfPO(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Print Purchase Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrders;
