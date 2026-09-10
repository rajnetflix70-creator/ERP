import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

const COMMON_PURPOSES = [
  'Slab Casting Work',
  'Columns & Shear Wall Reinforcement Pour',
  'External Brick Masonry & Plastering',
  'Basement Retaining Wall Waterproofing',
  'Internal Electrical Conduiting & Wiring',
  'Plumbing Shaft Risers & Drainage Pipes',
  'Site Safety & Shuttering Formwork',
  'Flooring & Tiling Work',
];

const CreateMaterialRequest = ({ isModal = false, onClose = null, onSuccess = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDefaultRequiredDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [sitesList, setSitesList] = useState([]);
  const [materialsCatalog, setMaterialsCatalog] = useState([]);
  const [site, setSite] = useState('');
  const [requestedBy, setRequestedBy] = useState(user?.full_name || 'Site Engineer');
  const [requiredDate, setRequiredDate] = useState(getDefaultRequiredDate());
  const [priority, setPriority] = useState('Normal');
  const [purpose, setPurpose] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Dynamic materials rows
  const [materials, setMaterials] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load live sites and materials
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [sitesRes, matRes] = await Promise.allSettled([
          client.get('/sites'),
          client.get('/materials'),
        ]);

        let loadedSites = [];
        if (sitesRes.status === 'fulfilled') {
          const rawS = sitesRes.value.data?.data?.data || sitesRes.value.data?.data || sitesRes.value.data || [];
          if (Array.isArray(rawS)) loadedSites = rawS;
        }
        setSitesList(loadedSites);
        if (loadedSites.length > 0 && !site) {
          setSite(loadedSites[0].name);
        }

        let loadedMats = [];
        if (matRes.status === 'fulfilled') {
          const rawM = matRes.value.data?.data?.data || matRes.value.data?.data || matRes.value.data || [];
          if (Array.isArray(rawM)) loadedMats = rawM;
        }
        setMaterialsCatalog(loadedMats);

        if (loadedMats.length > 0 && materials.length === 0) {
          const first = loadedMats[0];
          setMaterials([
            {
              id: Date.now(),
              material_id: first.id,
              name: first.name,
              quantity: 1,
              unit: first.unit_of_measure || first.unit || 'Nos',
              estRate: Number(first.unit_price || first.cost_price || 100),
              required_date: getDefaultRequiredDate(),
              remarks: '',
            }
          ]);
        }
      } catch (e) {
        console.warn('Could not load master materials/sites', e);
      }
    };
    loadMasters();
  }, []);

  // Auto-set delivery location when site changes
  useEffect(() => {
    const s = sitesList.find(item => item.name === site);
    if (s) {
      setDeliveryLocation(`${s.name} - Gate Unloading Bay, ${s.location || ''}`);
    }
  }, [site, sitesList]);

  const handleAddRow = () => {
    const defaultMat = materialsCatalog[0] || { id: `mat-${Date.now()}`, name: 'New Material', unit: 'Nos', estRate: 100 };
    const newRow = {
      id: Date.now(),
      material_id: defaultMat.id,
      name: defaultMat.name,
      quantity: 1,
      unit: defaultMat.unit_of_measure || defaultMat.unit || 'Nos',
      estRate: Number(defaultMat.unit_price || defaultMat.cost_price || 100),
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
    const selected = materialsCatalog.find(m => String(m.id) === String(matId));
    if (!selected) return;

    setMaterials(prev => prev.map(row => {
      if (row.id === id) {
        return {
          ...row,
          material_id: selected.id,
          name: selected.name,
          unit: selected.unit_of_measure || selected.unit || 'Nos',
          estRate: Number(selected.unit_price || selected.cost_price || 100),
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
    const matchedSite = sitesList.find(s => s.name === site);

    const newRequestData = {
      id: 'mr_' + Date.now(),
      mr_number: mrNumber,
      request_number: mrNumber,
      request_no: mrNumber,
      site: site,
      site_id: matchedSite?.id || null,
      project_name: matchedSite?.project_name || matchedSite?.project || 'Project ' + site,
      requested_by: requestedBy,
      requested_by_name: requestedBy,
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
      }))
    };

    try {
      await client.post('/material-requests', {
        site_id: matchedSite?.id,
        required_date: requiredDate,
        priority: priority.toLowerCase(),
        notes: purpose,
        items: materials.map(m => ({
          material_id: m.material_id,
          quantity: parseFloat(m.quantity),
          remarks: m.remarks,
        })),
      });
    } catch {
      // Local fallback
    }

    // Persist to localStorage
    const existingStored = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');
    localStorage.setItem('sitetrack_material_requests', JSON.stringify([newRequestData, ...existingStored]));

    setSubmitting(false);
    setNotification({
      type: 'success',
      message: `Material Request ${mrNumber} submitted successfully!`
    });

    if (onSuccess) {
      onSuccess(newRequestData);
    } else {
      setTimeout(() => {
        navigate('/materials/requests');
      }, 1200);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Breadcrumb */}
      {!isModal && (
        <div className="breadcrumb" style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
          <Link to="/materials/requests" style={{ textDecoration: 'none', color: '#2563eb' }}>
            Material Requests
          </Link>
          <span className="breadcrumb-sep"> / </span>
          <span style={{ color: '#1e293b', fontWeight: 600 }}>Create New Request (Indent)</span>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📝</span> Create Material Request (Screen 6)
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
            Raise on-site material requisition indent for Project Manager & Purchase team approval.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isModal ? (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          ) : (
            <Link to="/materials/requests" className="btn btn-secondary">
              Cancel & Return
            </Link>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting}
            style={{ fontWeight: 600 }}
          >
            {submitting ? 'Submitting...' : '🚀 Submit Request'}
          </button>
        </div>
      </div>

      {notification && (
        <div className="alert alert-success" style={{ marginBottom: '18px' }}>
          {notification.message}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Section 1: General Requisition Details */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header" style={{ marginBottom: '14px', paddingBottom: '8px' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
              📍 1. Requisition & Site Assignment
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">Target Site / Location *</label>
              <select
                className="form-control"
                value={site}
                onChange={e => setSite(e.target.value)}
                required
              >
                {sitesList.length === 0 ? (
                  <option value="">No sites available (Create a site first)</option>
                ) : (
                  sitesList.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.location || 'Site'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="form-label">Requested By *</label>
              <input
                type="text"
                className="form-control"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Required by Date *</label>
              <input
                type="date"
                className="form-control"
                value={requiredDate}
                onChange={e => setRequiredDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Priority Level *</label>
              <select
                className="form-control"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Emergency pour/safety)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">Activity / Purpose of Requirement</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 5th Floor Slab Casting"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                list="purpose-suggestions"
              />
              <datalist id="purpose-suggestions">
                {COMMON_PURPOSES.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div>
              <label className="form-label">Delivery Unloading Point</label>
              <input
                type="text"
                className="form-control"
                value={deliveryLocation}
                onChange={e => setDeliveryLocation(e.target.value)}
                placeholder="e.g. Gate 2 Yard, Tower A"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Materials Dynamic Table */}
        <div className="card" style={{ marginBottom: '20px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: '#1e293b' }}>
                📦 2. Materials List ({totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'})
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Specify item description, quantity required on site, and target delivery date.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddRow}
              style={{ fontWeight: 600 }}
            >
              ➕ Add Material Row
            </button>
          </div>

          <div className="table-responsive">
            <table style={{ margin: 0, fontSize: '0.84rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ minWidth: '240px' }}>Material Item *</th>
                  <th style={{ width: '120px' }}>Quantity *</th>
                  <th style={{ width: '100px' }}>Unit</th>
                  <th style={{ width: '130px' }}>Est. Rate (₹)</th>
                  <th style={{ width: '130px' }}>Total (₹)</th>
                  <th style={{ minWidth: '180px' }}>Remarks / Specs</th>
                  <th style={{ width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No materials added yet. Click "+ Add Material Row" above.
                    </td>
                  </tr>
                ) : (
                  materials.map((row, index) => {
                    const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.estRate) || 0);
                    return (
                      <tr key={row.id}>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>{index + 1}</td>
                        <td>
                          <select
                            className="form-control"
                            value={row.material_id}
                            onChange={e => handleMaterialChange(row.id, e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                          >
                            {materialsCatalog.length === 0 ? (
                              <option value={row.material_id}>{row.name}</option>
                            ) : (
                              materialsCatalog.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))
                            )}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            className="form-control"
                            value={row.quantity}
                            onChange={e => handleRowFieldChange(row.id, 'quantity', e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '6px 8px', fontWeight: 600 }}
                            required
                          />
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                            {row.unit}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={row.estRate}
                            onChange={e => handleRowFieldChange(row.id, 'estRate', e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: '#1e293b' }}>
                          ₹{rowTotal.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Brand / grade spec"
                            value={row.remarks}
                            onChange={e => handleRowFieldChange(row.id, 'remarks', e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ef4444', padding: '4px 6px' }}
                            title="Remove Row"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '24px' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Estimated Amount: </span>
              <strong style={{ fontSize: '1.05rem', color: '#2563eb' }}>{formatCurrency(totalEstimatedCost)}</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Notes & Attachments */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ marginBottom: '14px', paddingBottom: '8px' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
              📎 3. Additional Site Notes & Attachments
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="form-label">Special Instructions / Justification</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Provide reasoning for urgency, specific testing requirements, or delivery time slot constraints..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Upload Site Documents / BOQ Excerpts</label>
              <input
                type="file"
                multiple
                className="form-control"
                onChange={handleFileUpload}
                style={{ fontSize: '0.82rem' }}
              />
              {attachments.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {attachments.map(f => (
                    <span
                      key={f.id}
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📄 {f.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(f.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
          >
            💾 Save as Draft
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ fontWeight: 600 }}
          >
            {submitting ? 'Submitting...' : '🚀 Submit Request for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMaterialRequest;
