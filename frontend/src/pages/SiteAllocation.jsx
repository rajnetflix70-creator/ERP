import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const SiteAllocation = () => {
  const [machines, setMachines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [condition, setCondition] = useState('Excellent');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, oRes] = await Promise.all([
        apiClient.get('/equipment-machines'),
        apiClient.get('/projects'),
        apiClient.get('/equipment-machines/operators')
      ]);
      setMachines(Array.isArray(mRes?.data) ? mRes.data : []);
      setProjects(Array.isArray(pRes?.data) ? pRes.data : []);
      setOperators(Array.isArray(oRes?.data) ? oRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !selectedProject) {
      setAlert({ type: 'error', message: 'Please select both equipment and target construction site.' });
      return;
    }

    setSubmitting(true);
    try {
      const proj = projects.find(p => p.id === selectedProject);
      const siteName = proj ? `${proj.ak_job_no || 'AK'}.${proj.project_name}` : 'Construction Site';

      await apiClient.put(`/equipment-machines/${selectedMachine}`, {
        current_location_name: siteName,
        current_site_id: selectedProject,
        status: 'deployed',
        condition_remarks: `Allocated to site: ${siteName} (${condition}). ${notes}`
      });

      setAlert({ type: 'success', message: `Equipment successfully allocated to site "${siteName}"!` });
      setSelectedMachine('');
      setSelectedProject('');
      setSelectedOperator('');
      setModalOpen(false);
      setMachines(Array.isArray(machines) ? machines : []);
      setProjects(Array.isArray(projects) ? projects : []);
      setOperators(Array.isArray(operators) ? operators : []);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to allocate equipment.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading site fleet allocations...</div>;

  const safeMachines = Array.isArray(machines) ? machines : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeOperators = Array.isArray(operators) ? operators : [];
  const deployedMachines = safeMachines.filter(m => m?.status === 'deployed' || (m?.current_location_name && !m.current_location_name.toUpperCase().includes('STORE')));

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
            🏗️ Equipment Site Allocation
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Assign machines to active AK Construction sites and operators.
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
          ➕ Allocate Equipment to Site
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

      {/* Currently Deployed Fleet Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Currently Allocated Site Fleet ({deployedMachines.length} Deployed Units)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Equipment Code</th>
                <th style={{ padding: '0.75rem' }}>Type & Brand</th>
                <th style={{ padding: '0.75rem' }}>Current Site</th>
                <th style={{ padding: '0.75rem' }}>Hardware Specs</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {deployedMachines.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    No machinery currently allocated to active project sites.
                  </td>
                </tr>
              ) : (
                deployedMachines.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700' }}>#{m.machine_no || m.jack_no || 'EQ'}</td>
                    <td style={{ padding: '0.75rem' }}>{m.brand} {m.machine_type}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2563eb' }}>📍 {m.current_location_name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {m.jack_no && <span>Jack: {m.jack_no} | </span>}
                      {m.pump_no && <span>Pump: {m.pump_no}</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af'
                      }}>
                        Deployed On Site
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="🏗️ Allocate Equipment to Construction Site"
        subtitle="Select equipment, project site, and assigned operator."
      >
        <form onSubmit={handleAllocate}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Select Available Equipment *
              </label>
              <select
                value={selectedMachine}
                onChange={e => setSelectedMachine(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Choose Equipment ({machines.length} units) --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    #{m.machine_no || m.jack_no || m.equipment_code} ({m.machine_type}) - Currently: {m.current_location_name || 'Store'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Target Construction Site *
              </label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Select Project Site ({projects.length} sites) --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.ak_job_no || 'AK'}] {p.project_name} (Supervisor: {p.supervisor_names || 'Unassigned'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Assigned Operator / Driver
              </label>
              <select
                value={selectedOperator}
                onChange={e => setSelectedOperator(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Select Licensed Operator --</option>
                {operators.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.license_type || 'Operator'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Initial Physical Condition
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="Excellent">Excellent (New / Calibrated)</option>
                <option value="Good">Good (Working Order)</option>
                <option value="Fair">Fair (Minor Wear)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Allocation Notes / Dispatch Remarks
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows="2"
                placeholder="e.g. Dispatched with 2 spare hoses and calibrated pressure gauge..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Allocating...' : 'Confirm Site Allocation ✓'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SiteAllocation;
