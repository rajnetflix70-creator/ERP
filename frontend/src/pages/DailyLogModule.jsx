import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const STORES_LIST = [
  'PELAGOS STORE',
  'TYCOON STORE',
  'ABDUL AZIZ STORE',
  'UNASSIGNED STORE'
];

const DailyLogModule = () => {
  const [machines, setMachines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dailyGridData, setDailyGridData] = useState([]);
  const [selectedMachineType, setSelectedMachineType] = useState('stressing');
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMachine, setSelectedMachine] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startMeter, setStartMeter] = useState('');
  const [endMeter, setEndMeter] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [idleHours, setIdleHours] = useState('');
  const [fuelUsed, setFuelUsed] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedMachineType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, gridRes, projRes] = await Promise.all([
        apiClient.get('/equipment-machines'),
        apiClient.get(`/equipment-machines/daily-grid?machine_type=${selectedMachineType}&start_date=2026-02-01&end_date=2026-02-21`),
        apiClient.get('/projects')
      ]);
      setMachines(mRes.data || []);
      setDailyGridData(gridRes.data || []);
      setProjects(projRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // AI Smart Auto-Fill location when machine is selected
  const handleMachineSelect = (mId) => {
    setSelectedMachine(mId);
    const m = machines.find(item => item.id === mId);
    if (m && m.current_location_name) {
      setLocationName(m.current_location_name);
    }
  };

  // Auto calculate total working hours on endMeter change
  const handleEndMeterChange = (val) => {
    setEndMeter(val);
    if (startMeter && val) {
      const diff = parseFloat(val) - parseFloat(startMeter);
      if (diff >= 0) setWorkingHours(diff.toFixed(1));
    }
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !locationName) {
      setAlert({ type: 'error', message: 'Select equipment and location site.' });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/equipment-machines/daily-log', {
        machine_id: selectedMachine,
        log_date: logDate,
        location_name: locationName,
        start_meter: parseFloat(startMeter) || 0,
        end_meter: parseFloat(endMeter) || 0,
        working_hours: parseFloat(workingHours) || 0,
        idle_hours: parseFloat(idleHours) || 0,
        fuel_used: parseFloat(fuelUsed) || 0,
        work_description: workDescription
      });

      setAlert({ type: 'success', message: 'Daily equipment log successfully recorded!' });
      setSelectedMachine('');
      setLocationName('');
      setStartMeter('');
      setEndMeter('');
      setWorkingHours('');
      setIdleHours('');
      setFuelUsed('');
      setWorkDescription('');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to record daily log.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Dates for PDF Matrix Grid
  const dateColumns = [];
  for (let d = 1; d <= 21; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    dateColumns.push({ key: `2026-02-${dayStr}`, label: `${d}/2/2026` });
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
            📅 Daily Equipment Usage & PDF Site Tracking Log
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Log meter readings, working hours, and view real-time location breakdown.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2563eb',
            color: '#fff',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(37,99,235,0.2)'
          }}
        >
          ➕ Record Daily Log Entry
        </button>
      </div>

      {alert && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: alert.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: alert.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {alert.message}
        </div>
      )}

      {/* PDF Dynamic Site Tracking Matrix View */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Dynamic PDF Site Movement Tracking Matrix (Feb 1 – Feb 21, 2026)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Real-time site location breakdown extracted & stored dynamically from construction logs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['stressing', 'flower', 'grouting', 'auxiliary'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedMachineType(t)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  backgroundColor: selectedMachineType === t ? '#1e293b' : '#ffffff',
                  color: selectedMachineType === t ? '#ffffff' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '1rem' }}>Loading site matrix...</p>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '0.6rem', border: '1px solid #334155' }}>Machine #</th>
                  <th style={{ padding: '0.6rem', border: '1px solid #334155' }}>Brand / Specs</th>
                  {dateColumns.map(c => (
                    <th key={c.key} style={{ padding: '0.6rem', border: '1px solid #334155', minWidth: '110px' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyGridData.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: '700', backgroundColor: '#f8fafc' }}>
                      #{m.machine_no || m.jack_no || 'EQ'}
                    </td>
                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', color: '#475569' }}>
                      {m.brand || m.machine_type} {m.jack_no ? `(Jack:${m.jack_no})` : ''}
                    </td>
                    {dateColumns.map(c => {
                      const loc = (m.daily_locations && m.daily_locations[c.key]) || m.current_location_name || '-';
                      const isStore = loc.toUpperCase().includes('STORE');
                      return (
                        <td key={c.key} style={{
                          padding: '0.5rem',
                          border: '1px solid #cbd5e1',
                          backgroundColor: isStore ? '#fee2e2' : '#fef9c3',
                          color: isStore ? '#991b1b' : '#854d0e',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          {loc}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popup Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="📅 Record Daily Equipment Usage Log"
        subtitle="Submit meter readings and site working hours."
      >
        <form onSubmit={handleSubmitLog}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Log Date *</label>
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Equipment *</label>
              <select
                value={selectedMachine}
                onChange={e => handleMachineSelect(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Choose Machine ({machines.length}) --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>#{m.machine_no || m.jack_no || m.equipment_code} ({m.machine_type})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Site / Store Location *</label>
              <select
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Select Site / Store ({projects.length} sites) --</option>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Start Meter</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={startMeter}
                  onChange={e => setStartMeter(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>End Meter</label>
                <input
                  type="number"
                  placeholder="e.g. 108"
                  value={endMeter}
                  onChange={e => handleEndMeterChange(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Working Hours (Auto)</label>
                <input
                  type="number"
                  placeholder="Auto-calculated"
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Idle Hours</label>
                <input
                  type="number"
                  placeholder="e.g. 1.5"
                  value={idleHours}
                  onChange={e => setIdleHours(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Fuel Used (Liters)</label>
              <input
                type="number"
                placeholder="e.g. 25"
                value={fuelUsed}
                onChange={e => setFuelUsed(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Daily Log Entry ✓'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DailyLogModule;
