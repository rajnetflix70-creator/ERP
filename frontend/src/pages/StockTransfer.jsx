import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const StockTransfer = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [viewTransfer, setViewTransfer] = useState(null);

  // Form State
  const initialForm = {
    transfer_no: `TRF-${dayjs().format('YYYY')}-${Math.floor(1000 + Math.random() * 9000)}`,
    transfer_date: dayjs().format('YYYY-MM-DD'),
    source_site: '',
    destination_site: '',
    material_id: '',
    material_name: '',
    quantity: '',
    unit: 'Nos',
    vehicle_no: '',
    driver_name: '',
    driver_phone: '',
    challan_no: `DC-${Math.floor(10000 + Math.random() * 90000)}`,
    remarks: '',
  };

  const [form, setForm] = useState(initialForm);

  // Load live materials and sites
  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, siteRes] = await Promise.allSettled([
        apiClient.get('/materials?limit=200'),
        apiClient.get('/sites?limit=100'),
      ]);

      if (matRes.status === 'fulfilled') {
        const rawM = matRes.value?.data?.data?.data || matRes.value?.data?.data || matRes.value?.data || [];
        if (Array.isArray(rawM)) setMaterials(rawM);
      }

      if (siteRes.status === 'fulfilled') {
        const rawS = siteRes.value?.data?.data || siteRes.value?.data || [];
        if (Array.isArray(rawS)) setSites(rawS);
      }

      setTransfers([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveTransfersToStorage = (updated) => {
    setTransfers(updated);
  };

  const handleMaterialChange = (matId) => {
    const found = materials.find(m => String(m.id) === String(matId));
    setForm(prev => ({
      ...prev,
      material_id: matId,
      material_name: found ? (found.name || found.material_name) : '',
      unit: found ? (found.unit || 'Nos') : 'Nos',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.source_site || !form.destination_site) {
      setAlert({ type: 'danger', message: 'Please select both source and destination sites.' });
      return;
    }
    if (form.source_site === form.destination_site) {
      setAlert({ type: 'danger', message: 'Source and destination sites cannot be the same.' });
      return;
    }
    if (!form.material_name || !form.quantity || Number(form.quantity) <= 0) {
      setAlert({ type: 'danger', message: 'Please select a material and enter a valid transfer quantity.' });
      return;
    }

    const newTransfer = {
      id: Date.now(),
      ...form,
      quantity: Number(form.quantity),
      status: 'In Transit',
      created_by: user?.full_name || 'Admin',
      created_at: new Date().toISOString(),
    };

    const updated = [newTransfer, ...transfers];
    saveTransfersToStorage(updated);
    setShowModal(false);
    setForm({
      ...initialForm,
      transfer_no: `TRF-${dayjs().format('YYYY')}-${Math.floor(1000 + Math.random() * 9000)}`,
      challan_no: `DC-${Math.floor(10000 + Math.random() * 90000)}`,
    });
    setAlert({ type: 'success', message: `Transfer ${newTransfer.transfer_no} dispatched successfully.` });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleStatusUpdate = (id, newStatus) => {
    const updated = transfers.map(t => (t.id === id ? { ...t, status: newStatus, received_at: new Date().toISOString() } : t));
    saveTransfersToStorage(updated);
    setAlert({ type: 'success', message: `Transfer marked as ${newStatus}.` });
    setTimeout(() => setAlert(null), 3000);
  };

  const filtered = useMemo(() => {
    return transfers.filter(t => {
      const matchSearch =
        !search ||
        (t.transfer_no || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.material_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.challan_no || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.vehicle_no || '').toLowerCase().includes(search.toLowerCase());

      const matchSource = !sourceFilter || t.source_site === sourceFilter;
      const matchDest = !destFilter || t.destination_site === destFilter;
      const matchStatus = !statusFilter || t.status === statusFilter;

      return matchSearch && matchSource && matchDest && matchStatus;
    });
  }, [transfers, search, sourceFilter, destFilter, statusFilter]);

  const totalTransfers = transfers.length;
  const inTransitCount = transfers.filter(t => t.status === 'In Transit').length;
  const receivedCount = transfers.filter(t => t.status === 'Received').length;

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {alert && (
        <div
          className={`alert ${alert.type === 'danger' ? 'alert-danger' : 'alert-success'}`}
          style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔄</span> Inter-Site Stock Transfer
          </h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Dispatch, transport, and track material movement between central warehouses and construction sites.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ padding: '9px 18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>➕</span> + New Stock Transfer
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Transfers</span>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#1e293b' }}>{totalTransfers}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>All recorded transfer dispatches</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">In Transit</span>
            <span style={{ fontSize: '1.2rem' }}>🚛</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#2563eb' }}>{inTransitCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '4px' }}>Dispatched, pending site arrival</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Received & Cleared</span>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#16a34a' }}>{receivedCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px' }}>Acknowledged at destination site</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Active Sites</span>
            <span style={{ fontSize: '1.2rem' }}>🏗️</span>
          </div>
          <div className="stat-number" style={{ marginTop: '8px', color: '#8b5cf6' }}>{sites.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#8b5cf6', marginTop: '4px' }}>Available dispatch & receipt locations</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search Transfer No, Material, Challan, Vehicle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select className="form-control" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              <option value="">Source: All Locations</option>
              <option value="Central Store">Central Store / Main Warehouse</option>
              {sites.map(s => (
                <option key={s.id || s.name} value={s.name || s.site_name}>{s.name || s.site_name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select className="form-control" value={destFilter} onChange={e => setDestFilter(e.target.value)}>
              <option value="">Destination: All Sites</option>
              {sites.map(s => (
                <option key={s.id || s.name} value={s.name || s.site_name}>{s.name || s.site_name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px' }}>Transfer No</th>
                <th>Date</th>
                <th>Source Location</th>
                <th>Destination Site</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Vehicle / DC</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔄</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>No Stock Transfers Found</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "+ New Stock Transfer" to dispatch materials between sites.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{t.transfer_no}</td>
                    <td>{t.transfer_date}</td>
                    <td><span style={{ fontWeight: 600, color: '#1e293b' }}>{t.source_site}</span></td>
                    <td><span style={{ fontWeight: 600, color: '#0f766e' }}>{t.destination_site}</span></td>
                    <td><div style={{ fontWeight: 600, color: '#1e293b' }}>{t.material_name}</div></td>
                    <td><span style={{ fontWeight: 700, color: '#1e293b' }}>{t.quantity}</span> {t.unit}</td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>{t.vehicle_no || 'N/A'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>DC: {t.challan_no}</div>
                    </td>
                    <td>
                      {t.status === 'In Transit' ? (
                        <span className="badge badge-warning">🚛 In Transit</span>
                      ) : (
                        <span className="badge badge-success">✅ Received</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setViewTransfer(t)}
                          title="View Challan"
                          style={{ padding: '4px 8px' }}
                        >
                          👁️ View
                        </button>
                        {t.status === 'In Transit' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleStatusUpdate(t.id, 'Received')}
                            title="Acknowledge Receipt"
                            style={{ padding: '4px 8px' }}
                          >
                            📥 Receive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="➕ Dispatch Inter-Site Stock Transfer" maxWidth="700px">
        <form onSubmit={handleSubmit} style={{ padding: '8px 4px' }}>
          <div className="grid-2" style={{ gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Transfer Number</label>
              <input type="text" className="form-control" value={form.transfer_no} readOnly style={{ background: '#f8fafc' }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Transfer Date</label>
              <input
                type="date"
                className="form-control"
                value={form.transfer_date}
                onChange={e => setForm({ ...form, transfer_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Source Location *</label>
              <select
                className="form-control"
                value={form.source_site}
                onChange={e => setForm({ ...form, source_site: e.target.value })}
                required
              >
                <option value="">-- Select Source Location --</option>
                <option value="Central Store">Central Store / Main Warehouse</option>
                {sites.map(s => (
                  <option key={s.id || s.name} value={s.name || s.site_name}>{s.name || s.site_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Destination Site *</label>
              <select
                className="form-control"
                value={form.destination_site}
                onChange={e => setForm({ ...form, destination_site: e.target.value })}
                required
              >
                <option value="">-- Select Destination Site --</option>
                {sites.map(s => (
                  <option key={s.id || s.name} value={s.name || s.site_name}>{s.name || s.site_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3" style={{ gap: '14px', marginBottom: '14px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Material *</label>
              <select
                className="form-control"
                value={form.material_id}
                onChange={e => handleMaterialChange(e.target.value)}
                required
              >
                <option value="">-- Select Material from Catalog --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.material_name} ({m.category || 'General'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Quantity *</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  className="form-control"
                  placeholder="Qty"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  required
                />
                <input type="text" className="form-control" value={form.unit} readOnly style={{ width: '75px', background: '#f8fafc' }} />
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Vehicle Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. TN-09-AB-1234"
                value={form.vehicle_no}
                onChange={e => setForm({ ...form, vehicle_no: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Driver Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Driver Name"
                value={form.driver_name}
                onChange={e => setForm({ ...form, driver_name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Delivery Challan No</label>
              <input type="text" className="form-control" value={form.challan_no} readOnly style={{ background: '#f8fafc' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Remarks / Special Instructions</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Specify handling instructions, destination contact person, etc."
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>🚛 Dispatch Transfer</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(viewTransfer)} onClose={() => setViewTransfer(null)} title="📄 Stock Transfer Delivery Challan" maxWidth="600px">
        {viewTransfer && (
          <div style={{ padding: '8px 4px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>TRANSFER NUMBER</span>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>{viewTransfer.transfer_no}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>STATUS</span>
                  <div>
                    {viewTransfer.status === 'In Transit' ? (
                      <span className="badge badge-warning">🚛 In Transit</span>
                    ) : (
                      <span className="badge badge-success">✅ Received</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
                <div><strong>Source:</strong> {viewTransfer.source_site}</div>
                <div><strong>Destination:</strong> {viewTransfer.destination_site}</div>
                <div><strong>Dispatch Date:</strong> {viewTransfer.transfer_date}</div>
                <div><strong>Challan No:</strong> {viewTransfer.challan_no}</div>
                <div><strong>Vehicle No:</strong> {viewTransfer.vehicle_no || 'N/A'}</div>
                <div><strong>Driver:</strong> {viewTransfer.driver_name || 'N/A'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>Material Details</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Transfer Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{viewTransfer.material_name}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>
                      {viewTransfer.quantity} {viewTransfer.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {viewTransfer.remarks && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                <strong>Remarks:</strong> {viewTransfer.remarks}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setViewTransfer(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Challan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockTransfer;
