import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const BreakdownManagement = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [machineId, setMachineId] = useState('');
  const [breakdownDate, setBreakdownDate] = useState(new Date().toISOString().slice(0, 10));
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [reportedBy, setReportedBy] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [downtimeHours, setDowntimeHours] = useState('');
  const [resolution, setResolution] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, mRes] = await Promise.all([
        apiClient.get('/equipment-machines/breakdowns'),
        apiClient.get('/equipment-machines')
      ]);
      setBreakdowns(bRes.data || []);
      setMachines(mRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReportBreakdown = async (e) => {
    e.preventDefault();
    if (!machineId || !problemDescription) {
      setAlert({ type: 'error', message: 'Select equipment and describe problem.' });
      return;
    }

    try {
      await apiClient.post('/equipment-machines/breakdowns', {
        machine_id: machineId,
        breakdown_date: breakdownDate,
        problem_description: problemDescription,
        priority: priority,
        reported_by: reportedBy,
        assigned_technician: assignedTechnician,
        downtime_hours: parseFloat(downtimeHours) || 0,
        resolution: resolution,
        status: resolution ? 'Resolved' : 'Open'
      });

      setAlert({ type: 'success', message: 'Breakdown incident logged & machine status marked as BREAKDOWN.' });
      setMachineId('');
      setProblemDescription('');
      setReportedBy('');
      setResolution('');
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to record breakdown.' });
    }
  };

  const handleResolveBreakdown = async (id) => {
    try {
      await apiClient.patch(`/equipment-machines/breakdowns/${id}`, {
        status: 'Resolved',
        resolution: 'Repairs completed successfully & machine returned to active service.'
      });
      setAlert({ type: 'success', message: 'Breakdown marked as RESOLVED and machine restored to available.' });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to update breakdown.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading breakdown reports...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
        ⚠️ Equipment Breakdown & Emergency Downtime Management
      </h2>

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

      {/* Incident Report Form */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Report Equipment Breakdown Incident
        </h3>

        <form onSubmit={handleReportBreakdown} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Select Machine *</label>
            <select
              value={machineId}
              onChange={e => setMachineId(e.target.value)}
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Incident Date *</label>
            <input
              type="date"
              value={breakdownDate}
              onChange={e => setBreakdownDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Priority Level</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Critical">🔴 Critical (Site Halted)</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Reported By</label>
            <input
              type="text"
              placeholder="e.g. Supervisor Manikandan"
              value={reportedBy}
              onChange={e => setReportedBy(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Assigned Technician</label>
            <input
              type="text"
              placeholder="e.g. Eng. Hassan Raza"
              value={assignedTechnician}
              onChange={e => setAssignedTechnician(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Estimated Downtime (Hours)</label>
            <input
              type="number"
              placeholder="e.g. 4.5"
              value={downtimeHours}
              onChange={e => setDowntimeHours(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Problem Description *</label>
            <textarea
              rows={2}
              placeholder="Describe failure, symptom, or ruptured component..."
              value={problemDescription}
              onChange={e => setProblemDescription(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Report Breakdown Incident
            </button>
          </div>
        </form>
      </div>

      {/* Incident Log Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Breakdown Incident & Downtime History
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Machine</th>
                <th style={{ padding: '0.75rem' }}>Priority</th>
                <th style={{ padding: '0.75rem' }}>Problem Description</th>
                <th style={{ padding: '0.75rem' }}>Downtime</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {breakdowns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No breakdown incidents logged.</td>
                </tr>
              ) : (
                breakdowns.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>{b.breakdown_date ? new Date(b.breakdown_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>#{b.machine_no || 'EQ'} ({b.machine_type})</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: b.priority === 'Critical' || b.priority === 'High' ? '#fee2e2' : '#fef9c3',
                        color: b.priority === 'Critical' || b.priority === 'High' ? '#991b1b' : '#854d0e'
                      }}>
                        {b.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{b.problem_description}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>{b.downtime_hours} hrs</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: b.status === 'Resolved' || b.status === 'Closed' ? '#dcfce7' : '#fee2e2',
                        color: b.status === 'Resolved' || b.status === 'Closed' ? '#15803d' : '#b91c1c'
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {b.status !== 'Resolved' && b.status !== 'Closed' && (
                        <button
                          onClick={() => handleResolveBreakdown(b.id)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Resolve & Clear ✓
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BreakdownManagement;
