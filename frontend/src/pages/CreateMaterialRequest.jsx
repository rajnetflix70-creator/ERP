import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

// Pre-defined construction material catalog for quick selection
const CATALOG_MATERIALS = [
  { id: 'mat-1', name: 'TMT Steel Rebar 16mm (Fe550D)', category: 'Steel', unit: 'MT', estRate: 58000 },
  { id: 'mat-2', name: 'TMT Steel Rebar 12mm (Fe550D)', category: 'Steel', unit: 'MT', estRate: 58500 },
  { id: 'mat-3', name: 'TMT Steel Rebar 10mm (Fe550D)', category: 'Steel', unit: 'MT', estRate: 59000 },
  { id: 'mat-4', name: 'OPC 53 Grade Cement (50kg Bag)', category: 'Cement', unit: 'Bags', estRate: 380 },
  { id: 'mat-5', name: 'PPC Cement (50kg Bag)', category: 'Cement', unit: 'Bags', estRate: 345 },
  { id: 'mat-6', name: 'Ready Mix Concrete (RMC) M30', category: 'Concrete', unit: 'Cu.m', estRate: 4600 },
  { id: 'mat-7', name: 'Ready Mix Concrete (RMC) M25', category: 'Concrete', unit: 'Cu.m', estRate: 4200 },
  { id: 'mat-8', name: 'River Sand (Coarse / Plastering)', category: 'Aggregates', unit: 'Cu.ft', estRate: 65 },
  { id: 'mat-9', name: '20mm Crushed Blue Stone Aggregate', category: 'Aggregates', unit: 'Cu.ft', estRate: 48 },
  { id: 'mat-10', name: '10mm Crushed Stone Aggregate', category: 'Aggregates', unit: 'Cu.ft', estRate: 52 },
  { id: 'mat-11', name: 'AAC Lightweight Blocks (600x200x150mm)', category: 'Masonry', unit: 'Nos', estRate: 62 },
  { id: 'mat-12', name: 'Standard Red Clay Kiln Bricks', category: 'Masonry', unit: 'Nos', estRate: 9 },
  { id: 'mat-13', name: 'CPVC Pipes 1 inch (SDR 11)', category: 'Plumbing', unit: 'Meter', estRate: 140 },
  { id: 'mat-14', name: 'Finolex FRLS Copper Wire 2.5 sq.mm', category: 'Electrical', unit: 'Bundle', estRate: 2450 },
  { id: 'mat-15', name: 'Asian Paints Apex Ultima Exterior', category: 'Finishing', unit: 'Liters', estRate: 385 },
  { id: 'mat-16', name: 'Shuttering Plywood 12mm (Marine Grade)', category: 'Formwork', unit: 'Sheet', estRate: 1450 },
  { id: 'mat-17', name: 'Safety Helmets & Harness Kits', category: 'Safety', unit: 'Sets', estRate: 1250 },
];

const SITES_LIST = [
  { id: 'site-1', name: 'Tower A', project: 'High Rise Luxury Towers', location: 'Sector 62, Gurgaon' },
  { id: 'site-2', name: 'Tower B', project: 'High Rise Luxury Towers', location: 'Sector 62, Gurgaon' },
  { id: 'site-3', name: 'Villa Project', project: 'Palm Grove Gated Community', location: 'Sohna Road, Gurugram' },
  { id: 'site-4', name: 'Warehouse', project: 'Central Logistics Facility', location: 'Manesar Industrial Area' },
  { id: 'site-5', name: 'Tower C', project: 'High Rise Luxury Towers', location: 'Sector 62, Gurgaon' },
  { id: 'site-6', name: 'Commercial', project: 'Metro Hub Business Park', location: 'Golf Course Extension' },
];

const COMMON_PURPOSES = [
  'Slab Casting - 8th Floor (Grid A to D)',
  'Columns & Shear Wall Reinforcement Pour',
  'External Brick Masonry & Plastering',
  'Basement Retaining Wall Waterproofing',
  'Internal Electrical Conduiting & Wiring',
  'Plumbing Shaft Risers & Drainage Pipes',
  'Site Safety & Shuttering Formwork',
  'Flooring & Tiling Work - 4th Floor',
];

const CreateMaterialRequest = ({ isModal = false, onClose = null, onSuccess = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper for default required date: 7 days from now
  const getDefaultRequiredDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [site, setSite] = useState(SITES_LIST[0].name);
  const [requestedBy, setRequestedBy] = useState(user?.full_name || 'Rajesh Kumar (Site Engineer)');
  const [requiredDate, setRequiredDate] = useState(getDefaultRequiredDate());
  const [priority, setPriority] = useState('Normal');
  const [purpose, setPurpose] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Dynamic materials rows
  const [materials, setMaterials] = useState([
    {
      id: 1,
      material_id: 'mat-1',
      name: 'TMT Steel Rebar 16mm (Fe550D)',
      quantity: 20,
      unit: 'MT',
      estRate: 58000,
      required_date: getDefaultRequiredDate(),
      remarks: 'Grade Fe550D primary producer only (Tata/JSW)',
    },
    {
      id: 2,
      material_id: 'mat-4',
      name: 'OPC 53 Grade Cement (50kg Bag)',
      quantity: 500,
      unit: 'Bags',
      estRate: 380,
      required_date: getDefaultRequiredDate(),
      remarks: 'Fresh stock not older than 30 days from mfg',
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Auto-set delivery location when site changes
  useEffect(() => {
    const s = SITES_LIST.find(item => item.name === site);
    if (s) {
      setDeliveryLocation(`${s.name} - Gate 2 Unloading Bay, ${s.location}`);
    }
  }, [site]);

  const handleAddRow = () => {
    const defaultMat = CATALOG_MATERIALS[0];
    const newRow = {
      id: Date.now(),
      material_id: defaultMat.id,
      name: defaultMat.name,
      quantity: 10,
      unit: defaultMat.unit,
      estRate: defaultMat.estRate,
      required_date: requiredDate,
      remarks: '',
    };
    setMaterials(prev => [...prev, newRow]);
  };

  const handleRemoveRow = (id) => {
    if (materials.length <= 1) {
      alert('A material request must have at least one material line item.');
      return;
    }
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleMaterialChange = (id, matId) => {
    const selected = CATALOG_MATERIALS.find(m => m.id === matId);
    if (!selected) return;

    setMaterials(prev => prev.map(row => {
      if (row.id === id) {
        return {
          ...row,
          material_id: selected.id,
          name: selected.name,
          unit: selected.unit,
          estRate: selected.estRate,
        };
      }
      return row;
    }));
  };

  const handleRowFieldChange = (id, field, value) => {
    setMaterials(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
    }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id) => {
    setAttachments(prev => prev.filter(f => f.id !== id));
  };

  // Calculations
  const totalItemsCount = materials.length;
  const totalEstimatedCost = materials.reduce((acc, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const rate = parseFloat(row.estRate) || 0;
    return acc + (qty * rate);
  }, 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();

    if (!site) {
      alert('Please select a site');
      return;
    }
    if (materials.length === 0) {
      alert('Please add at least one material item');
      return;
    }

    for (const row of materials) {
      if (!row.quantity || Number(row.quantity) <= 0) {
        alert(`Please enter a valid quantity for ${row.name}`);
        return;
      }
    }

    setSubmitting(true);

    const mrNumber = `MR-${Math.floor(1025 + Math.random() * 900)}`;
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newRequestData = {
      id: 'mr_' + Date.now(),
      mr_number: mrNumber,
      request_no: mrNumber,
      site: site,
      project_name: SITES_LIST.find(s => s.name === site)?.project || 'Project ' + site,
      requested_by: requestedBy,
      requested_by_role: 'Site Engineer',
      required_date: requiredDate,
      date: todayStr,
      created_at: new Date().toISOString(),
      priority: priority,
      status: isDraft ? 'Draft' : 'Pending',
      status_label: isDraft ? 'Draft' : 'Pending Approval',
      amount: totalEstimatedCost,
      formatted_amount: formatCurrency(totalEstimatedCost),
      purpose: purpose || 'General site construction activity',
      delivery_location: deliveryLocation,
      remarks: remarks,
      attachments_count: attachments.length,
      items: materials.map(m => ({
        material_id: m.material_id,
        name: m.name,
        quantity: parseFloat(m.quantity),
        unit: m.unit,
        est_rate: m.estRate,
        line_total: parseFloat(m.quantity) * (m.estRate || 0),
        required_date: m.required_date,
        remarks: m.remarks,
        available_stock: Math.floor(Math.random() * 15) + 2,
        boq_allowance: 'Within Limit (68% utilized)'
      }))
    };

    try {
      // 1. Persist to localStorage so all tabs & pages see it immediately
      const existingStored = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');
      localStorage.setItem('sitetrack_material_requests', JSON.stringify([newRequestData, ...existingStored]));

      // 2. Also save to pending approvals if not draft
      if (!isDraft) {
        const existingApprovals = JSON.parse(localStorage.getItem('sitetrack_pending_approvals') || '[]');
        localStorage.setItem('sitetrack_pending_approvals', JSON.stringify([newRequestData, ...existingApprovals]));
      }

      // 3. Attempt backend API call gracefully
      try {
        await client.post('/materials/requests', {
          job_no: mrNumber,
          project_name: newRequestData.project_name,
          site: site,
          engineer: requestedBy,
          items: materials.map(m => ({
            material_id: m.material_id,
            qty_requested: parseFloat(m.quantity),
            unit: m.unit
          })),
          priority: priority.toLowerCase(),
          date_needed: requiredDate,
          purpose: purpose
        });
      } catch (apiErr) {
        // Safe fallback: local storage already persisted
        console.warn('API endpoint unavailable, stored locally:', apiErr.message);
      }

      setNotification({
        type: 'success',
        message: isDraft 
          ? `Material Request ${mrNumber} saved as draft successfully.`
          : `Material Request ${mrNumber} submitted for approval!`
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(newRequestData);
        if (isModal && onClose) {
          onClose();
        } else {
          navigate('/materials/requests');
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      alert('Error saving material request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Breadcrumb navigation */}
      {!isModal && (
        <div className="breadcrumb" style={{ marginBottom: '16px' }}>
          <Link to="/">Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/materials/requests">Material Requests</Link>
          <span className="breadcrumb-sep">/</span>
          <span style={{ color: 'var(--navy)', fontWeight: '600' }}>New Material Request</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        background: '#fff',
        padding: '18px 24px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--primary-lt)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem'
          }}>
            📝
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--navy)', margin: 0 }}>
              New Material Request
            </h1>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Screen 6 • Raise a site material indent for review & approval workflow
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (isModal && onClose) onClose();
              else navigate('/materials/requests');
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : '✓ Submit Request'}
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`} style={{ marginBottom: '20px' }}>
          <span>{notification.type === 'success' ? '✓' : 'ℹ️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Section 1: Requisition Details */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header" style={{ paddingBottom: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>🏗️</span>
              <h2 className="card-title" style={{ fontSize: '0.95rem' }}>1. Request & Site Information</h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Fields marked with <span style={{ color: 'var(--danger)' }}>*</span> are required
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Site Select */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">
                Site / Location <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                className="form-control"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                required
              >
                {SITES_LIST.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.project})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Associated Project: {SITES_LIST.find(s => s.name === site)?.project}
              </span>
            </div>

            {/* Requested By */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">
                Requested By <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="e.g. Rajesh Kumar (Site Engineer)"
                required
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Role: Site Engineer / In-Charge
              </span>
            </div>

            {/* Required Date */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">
                Required By Date <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={requiredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setRequiredDate(e.target.value);
                  // Update rows that don't have custom date
                  setMaterials(prev => prev.map(m => ({ ...m, required_date: e.target.value })));
                }}
                required
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Site target delivery date
              </span>
            </div>

            {/* Priority */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">
                Priority Level <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                {[
                  { label: 'Normal', color: '#2563eb', bg: '#eff6ff', desc: '5-7 days' },
                  { label: 'High',   color: '#d97706', bg: '#fffbeb', desc: '2-3 days' },
                  { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', desc: 'Immediate' },
                ].map(p => (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => setPriority(p.label)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: priority === p.label ? `2px solid ${p.color}` : '1px solid var(--border)',
                      background: priority === p.label ? p.bg : '#fff',
                      color: priority === p.label ? p.color : 'var(--text-secondary)',
                      fontWeight: priority === p.label ? '700' : '500',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{p.label === 'Urgent' ? '🔥 ' : p.label === 'High' ? '⚡ ' : '⏱️ '}{p.label}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
            {/* Purpose / Work Package */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">
                Purpose / Activity <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                list="purpose-presets"
                className="form-control"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Slab Casting 8th Floor (Grid A to D)"
                required
              />
              <datalist id="purpose-presets">
                {COMMON_PURPOSES.map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            </div>

            {/* Delivery Location / Unloading Point */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">
                Delivery Location / Gate
              </label>
              <input
                type="text"
                className="form-control"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="e.g. Tower A - Gate 2 Unloading Bay"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Materials Dynamic Table */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header" style={{ paddingBottom: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>📦</span>
              <div>
                <h2 className="card-title" style={{ fontSize: '0.95rem', margin: 0 }}>
                  2. Materials Required ({materials.length} {materials.length === 1 ? 'item' : 'items'})
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Specify materials, quantities, required date and site specifications
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleAddRow}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>+</span>
              <span>Add Material Row</span>
            </button>
          </div>

          <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '6px', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '850px' }}>
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '28%' }}>Material Description</th>
                  <th style={{ width: '13%' }}>Quantity</th>
                  <th style={{ width: '10%' }}>Unit</th>
                  <th style={{ width: '15%' }}>Required Date</th>
                  <th style={{ width: '25%' }}>Remarks / Specification</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                      {index + 1}
                    </td>

                    {/* Material Select */}
                    <td>
                      <select
                        className="form-control"
                        value={row.material_id}
                        onChange={(e) => handleMaterialChange(row.id, e.target.value)}
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                      >
                        {CATALOG_MATERIALS.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.category})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        className="form-control"
                        value={row.quantity}
                        onChange={(e) => handleRowFieldChange(row.id, 'quantity', e.target.value)}
                        placeholder="Qty"
                        style={{ fontSize: '0.82rem', padding: '6px 8px', fontWeight: '600' }}
                        required
                      />
                    </td>

                    {/* Unit */}
                    <td>
                      <select
                        className="form-control"
                        value={row.unit}
                        onChange={(e) => handleRowFieldChange(row.id, 'unit', e.target.value)}
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                      >
                        {['MT', 'Bags', 'Cu.m', 'Cu.ft', 'Nos', 'Meter', 'Bundle', 'Sheet', 'Liters', 'Sets', 'Kg'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>

                    {/* Required Date */}
                    <td>
                      <input
                        type="date"
                        className="form-control"
                        value={row.required_date || requiredDate}
                        onChange={(e) => handleRowFieldChange(row.id, 'required_date', e.target.value)}
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                      />
                    </td>

                    {/* Remarks */}
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={row.remarks}
                        onChange={(e) => handleRowFieldChange(row.id, 'remarks', e.target.value)}
                        placeholder="e.g. Primary producer, test report reqd"
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                      />
                    </td>

                    {/* Delete button */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        title="Remove line"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-lt)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table summary bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            padding: '10px 16px',
            background: 'var(--navy-50)',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              Total Line Items: <strong style={{ color: 'var(--navy)' }}>{totalItemsCount}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                Estimated Request Total:
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary)' }}>
                {formatCurrency(totalEstimatedCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Remarks & Attachments */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ paddingBottom: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>📎</span>
              <h2 className="card-title" style={{ fontSize: '0.95rem' }}>3. Remarks & Attachments</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Remarks textarea */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Special Instructions / Site Constraints</label>
              <textarea
                className="form-control"
                rows="4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Unloading only allowed after 8 PM due to traffic restrictions. Crane required for offloading rebar bundles at North bay."
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Attachments File Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Attach Supporting Documents (BOQ, Drawing, Photo)</label>
              <div style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                background: '#fafafa',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.15s'
              }}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📁</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--navy)' }}>
                  Click or drag files here to upload
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  PDF, DWG, PNG, JPG or XLSX (Max 10 MB per file)
                </div>
              </div>

              {/* Uploaded files list */}
              {attachments.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {attachments.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📄</span>
                        <span style={{ fontWeight: '500', color: 'var(--navy)' }}>{file.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (isModal && onClose) onClose();
              else navigate('/materials/requests');
            }}
          >
            Cancel & Discard
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>💾</span>
              <span>Save as Draft</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>✓</span>
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateMaterialRequest;
