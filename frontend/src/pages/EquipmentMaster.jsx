import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getEquipmentMachines, getEquipmentMachineStats, createEquipmentMachine, updateEquipmentMachine, deleteEquipmentMachine
} from '../api/equipment_machines';
import { getProjects } from '../api/projects';
import Modal from '../components/Modal';

const MACHINE_TYPES = [
  { value: 'stressing', label: '⚙ Stressing Machine' },
  { value: 'flower', label: '🧅 Flower / Onion Machine' },
  { value: 'grouting', label: '💧 Grouting Machine' },
  { value: 'gun', label: '🔫 Gun Machine' },
  { value: 'stapler_gun', label: '📌 Stapler Gun' },
  { value: 'coring', label: '🔘 Coring Machine' },
  { value: 'pneumatic_gun', label: '💨 Pneumatic Gun Machine' },
  { value: 'release_barrel', label: '🛢 Release Barrel' },
  { value: 'cutter', label: '✂ Husqvarna Concrete Cutter' },
  { value: 'drill', label: '🪛 Drill Machine' },
];

const BRAND_OPTIONS = [
  'CHINESE',
  'CHINESE(NEW)',
  'POWER TEAM',
  'RALLY',
  'INDIA(SUBRAMANIYAN)',
  'INDIA(KANWAR)',
  'HUSQVARNA',
  'OTHER'
];

const STORES_LIST = [
  'ABDUL AZIZ STORE',
  'PELAGOS STORE',
  'TYCOON STORE',
  'UNASSIGNED STORE'
];

const EMPTY_FORM = {
  machine_type: 'stressing',
  brand: 'CHINESE',
  machine_no: '',
  jack_no: '',
  pump_no: '',
  pressure_gauge_no: '',
  motor_no: '',
  calibration_cert_no: '',
  calibration_expiry_date: '',
  paired_set_code: '',
  current_location_name: 'ABDUL AZIZ STORE',
  condition_remarks: '',
  status: 'available',
};

const getCalibBadge = (expiryDate) => {
  if (!expiryDate) return { label: 'No Cert', color: 'badge-absent', icon: '❓' };
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(expiryDate); exp.setHours(0,0,0,0);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', color: 'badge-absent', icon: '🔴' };
  if (diffDays <= 30) return { label: `${diffDays}d left`, color: 'badge-warning', icon: '⚠️' };
  return { label: 'Valid', color: 'badge-present', icon: '🟢' };
};

const EquipmentMaster = () => {
  const { t } = useTranslation();
  const [machines, setMachines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.machine_type = activeTab;
      if (search) params.search = search;

      const [listRes, statsRes, projRes] = await Promise.all([
        getEquipmentMachines(params),
        getEquipmentMachineStats(),
        getProjects()
      ]);

      setMachines(listRes);
      setStats(statsRes);
      setProjects(projRes || []);
    } catch (e) {
      setAlert({ type: 'error', message: 'Failed to load equipment inventory' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(machines.length / PAGE_SIZE));
  const pagedMachines = machines.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditTarget(m);
    setForm({
      machine_type: m.machine_type || 'stressing',
      brand: m.brand || 'CHINESE',
      machine_no: m.machine_no || '',
      jack_no: m.jack_no || '',
      pump_no: m.pump_no || '',
      pressure_gauge_no: m.pressure_gauge_no || '',
      motor_no: m.motor_no || '',
      calibration_cert_no: m.calibration_cert_no || '',
      calibration_expiry_date: m.calibration_expiry_date ? new Date(m.calibration_expiry_date).toISOString().slice(0,10) : '',
      paired_set_code: m.paired_set_code || '',
      current_location_name: m.current_location_name || 'ABDUL AZIZ STORE',
      condition_remarks: m.condition_remarks || '',
      status: m.status || 'available',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    setFormLoading(true);
    try {
      if (editTarget) {
        await updateEquipmentMachine(editTarget.id, form);
        setAlert({ type: 'success', message: `Machine "${form.machine_no || editTarget.id}" updated successfully` });
      } else {
        await createEquipmentMachine(form);
        setAlert({ type: 'success', message: 'New equipment machine unit added to inventory' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save machine equipment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Are you sure you want to deactivate machine unit "${m.machine_no || m.jack_no || m.id}"?`)) return;
    try {
      await deleteEquipmentMachine(m.id);
      setAlert({ type: 'success', message: 'Machine unit deactivated' });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to deactivate machine' });
    }
  };

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          {alert.message}
          <button className="alert-close" onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Tracked Hardware Units</div>
          <div className="stat-value">{stats ? stats.total : '—'}</div>
          <div className="stat-sub font-mono">111 Machinery Units in PDF</div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Stressing Machines</div>
          <div className="stat-value">{stats ? stats.stressing : '—'}</div>
          <div className="stat-sub">Jacks, Pumps & Gauges</div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-label">Flower & Grouting</div>
          <div className="stat-value">{stats ? (stats.flower + stats.grouting) : '—'}</div>
          <div className="stat-sub">Grouting Pumps & Motors</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Auxiliary Tools</div>
          <div className="stat-value">{stats ? stats.auxiliary : '—'}</div>
          <div className="stat-sub">Guns, Barrels & Cutters</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="card-title">⚙ Equipment Machine Master Inventory</h3>
            <div className="card-subtitle">Manage physical machinery units, paired serials, calibration, and site deployments.</div>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            ➕ Add Machine Unit
          </button>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px 16px', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
          <button
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
          >
            All Units ({stats ? stats.total : 0})
          </button>
          {MACHINE_TYPES.map(t => (
            <button
              key={t.value}
              className={`btn btn-sm ${activeTab === t.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="controls-bar" style={{ padding: 16 }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Machine #, Jack #, Pump #, Gauge #, Cert #, Store..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Showing {machines.length} matching units
          </span>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Machine Code / Type</th>
                <th>Brand</th>
                <th>Jack / Pump / Gauge Specs</th>
                <th>ISO Calibration Cert</th>
                <th>Current Site / Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>
                    <div className="spinner" style={{ margin: '0 auto 8px auto' }} />
                    Loading equipment hardware inventory…
                  </td>
                </tr>
              ) : pagedMachines.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
                    No machinery units match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedMachines.map(m => {
                  const calib = getCalibBadge(m.calibration_expiry_date);
                  return (
                    <tr key={m.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>#{m.machine_no || 'UNCODED'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          {m.machine_type.replace('_', ' ')}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-asset" style={{ fontSize: '0.75rem' }}>{m.brand || 'CHINESE'}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {m.jack_no && <div><span style={{ color: 'var(--color-text-muted)' }}>Jack:</span> <strong>{m.jack_no}</strong></div>}
                          {m.pump_no && <div><span style={{ color: 'var(--color-text-muted)' }}>Pump:</span> <strong>{m.pump_no}</strong></div>}
                          {m.pressure_gauge_no && <div><span style={{ color: 'var(--color-text-muted)' }}>Gauge:</span> <strong>{m.pressure_gauge_no}</strong></div>}
                          {m.motor_no && <div><span style={{ color: 'var(--color-text-muted)' }}>Motor:</span> <strong>{m.motor_no}</strong></div>}
                          {!m.jack_no && !m.pump_no && !m.pressure_gauge_no && !m.motor_no && <span style={{ color: 'var(--color-text-muted)' }}>Standard Tool</span>}
                        </div>
                      </td>
                      <td>
                        {m.calibration_cert_no ? (
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.calibration_cert_no}</div>
                            <span className={`badge ${calib.color}`} style={{ marginTop: 2 }}>
                              {calib.icon} {calib.label}
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-absent">No Cert</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-primary)' }}>📍 {m.current_location_name || 'ABDUL AZIZ STORE'}</strong>
                        {m.condition_remarks && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {m.condition_remarks}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          m.status === 'available' ? 'badge-present' :
                          m.status === 'deployed' ? 'badge-asset' :
                          m.status === 'maintenance' ? 'badge-warning' : 'badge-absent'
                        }`}>
                          {m.status === 'available' ? '🟢 Available' :
                           m.status === 'deployed' ? '🚚 Deployed' :
                           m.status === 'maintenance' ? '🔧 Maintenance' : '❌ Missing'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(m)} title="Edit Machine">
                            ✏️ Edit
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)} title="Deactivate">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ padding: 16 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ◀ Prev
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Edit Machine #${editTarget.machine_no || editTarget.id}` : '➕ Register New Equipment Unit'}
      >
        <form onSubmit={handleSave}>
          {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>❌ {formError}</div>}

          <div className="form-section">
            <div className="form-section-title">Machine Identity</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Machine Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select className="form-control" name="machine_type" value={form.machine_type} onChange={handleFormChange} required>
                  {MACHINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <select className="form-control" name="brand" value={form.brand} onChange={handleFormChange}>
                  {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Machine Code / Serial No</label>
                <input className="form-control" name="machine_no" value={form.machine_no} onChange={handleFormChange} placeholder="e.g. STR-001 or GRT-11" />
              </div>
              <div className="form-group">
                <label className="form-label">Paired Hardware Set Code</label>
                <input className="form-control" name="paired_set_code" value={form.paired_set_code} onChange={handleFormChange} placeholder="e.g. SET-STR-01" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Hardware Specifications</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Jack No</label>
                <input className="form-control" name="jack_no" value={form.jack_no} onChange={handleFormChange} placeholder="e.g. 20" />
              </div>
              <div className="form-group">
                <label className="form-label">Pump No</label>
                <input className="form-control" name="pump_no" value={form.pump_no} onChange={handleFormChange} placeholder="e.g. 17(2311022)" />
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Pressure Gauge No</label>
                <input className="form-control" name="pressure_gauge_no" value={form.pressure_gauge_no} onChange={handleFormChange} placeholder="e.g. 9007X6YF" />
              </div>
              <div className="form-group">
                <label className="form-label">Motor No (for Grouting)</label>
                <input className="form-control" name="motor_no" value={form.motor_no} onChange={handleFormChange} placeholder="e.g. 24044103" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">ISO Calibration Certificate</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Calibration Cert Number</label>
                <input className="form-control" name="calibration_cert_no" value={form.calibration_cert_no} onChange={handleFormChange} placeholder="e.g. CERT-ISO-202601" />
              </div>
              <div className="form-group">
                <label className="form-label">Calibration Expiry Date</label>
                <input type="date" className="form-control" name="calibration_expiry_date" value={form.calibration_expiry_date} onChange={handleFormChange} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Location & Status</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Current Location / Site</label>
                <select className="form-control" name="current_location_name" value={form.current_location_name} onChange={handleFormChange}>
                  <optgroup label="🏬 Stores">
                    {STORES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                  <optgroup label="🏗️ Project Sites Master">
                    {projects.map(p => {
                      const val = p.ak_job_no ? `${p.ak_job_no}.${p.project_name}` : p.project_name;
                      return <option key={p.id} value={val}>[{p.ak_job_no || 'AK'}] {p.project_name}</option>;
                    })}
                  </optgroup>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" name="status" value={form.status} onChange={handleFormChange}>
                  <option value="available">✅ Available (In Store)</option>
                  <option value="deployed">🚚 Deployed On Site</option>
                  <option value="maintenance">🔧 Maintenance / Repair</option>
                  <option value="missing">❌ Missing / Unknown</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Condition Notes</div>
            <div className="form-group">
              <textarea className="form-control" name="condition_remarks" rows="2" value={form.condition_remarks} onChange={handleFormChange} placeholder="e.g. Pump only, Jack in Pelagos store..." />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <><span className="spinner" /> Saving…</> : (editTarget ? '💾 Save Changes' : '➕ Add Machine Unit')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EquipmentMaster;
