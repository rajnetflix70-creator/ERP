import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const STORES_LIST = [
  'PELAGOS STORE',
  'TYCOON STORE',
  'ABDUL AZIZ STORE',
  'UNASSIGNED STORE'
];

const EquipmentMovement = () => {
  const [movements, setMovements] = useState([]);
  const [machines, setMachines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [machineId, setMachineId] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transportDetails, setTransportDetails] = useState('Gulf Transport Heavy Flatbed #4421');
  const [handoverPerson, setHandoverPerson] = useState('');
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, macRes, projRes, opRes] = await Promise.all([
        apiClient.get('/equipment-machines/movements'),
        apiClient.get('/equipment-machines'),
        apiClient.get('/projects'),
        apiClient.get('/equipment-machines/operators')
      ]);
      setMovements(movRes.data || []);
      setMachines(macRes.data || []);
      setProjects(projRes.data || []);
      setOperators(opRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Smart AI Auto-Fill when selecting equipment
  const handleMachineChange = (mId) => {
    setMachineId(mId);
    const m = machines.find(item => item.id === mId);
    if (m) {
      setFromLocation(m.current_location_name || 'PELAGOS STORE');
      setTransferReason(`Routine site movement from ${m.current_location_name || 'Store'}`);
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!machineId || !toLocation) {
      setAlert({ type: 'error', message: 'Please select equipment and destination site.' });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/equipment-machines/movements', {
        machine_id: machineId,
        from_location_name: fromLocation,
        to_location_name: toLocation,
        transfer_date: new Date().toISOString().slice(0, 10),
        transfer_reason: transferReason,
        transport_details: transportDetails,
        handover_person: handoverPerson,
        status: 'In Transit'
      });

      setAlert({ type: 'success', message: 'Transfer request submitted & flagged as IN TRANSIT!' });
      setMachineId('');
      setFromLocation('');
      setToLocation('');
      setTransferReason('');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to submit transfer.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/equipment-machines/movements/${id}/status`, {
        status,
        receiving_person: 'Site Engineer'
      });
      setAlert({ type: 'success', message: `Movement status updated to "${status}"` });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to update movement status.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading equipment movements...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
            🚛 Equipment Movement & Site Transfer
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Track site-to-site equipment dispatch, transport, and delivery receipts.
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
          ➕ Request Site Transfer
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

      {/* Movement Log History Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Transfer & Movement Log History ({movements.length} Records)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Equipment</th>
                <th style={{ padding: '0.75rem' }}>From Location</th>
                <th style={{ padding: '0.75rem' }}>To Location</th>
                <th style={{ padding: '0.75rem' }}>Handover / Driver</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No movement records found.</td>
                </tr>
              ) : (
                movements.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>{m.transfer_date ? new Date(m.transfer_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>#{m.machine_no || 'EQ'} ({m.machine_type})</td>
                    <td style={{ padding: '0.75rem' }}>{m.from_location_name || 'Origin Store'}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2563eb' }}>{m.to_location_name || 'Target Site'}</td>
                    <td style={{ padding: '0.75rem' }}>{m.handover_person || m.transport_details || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: m.status === 'Completed' || m.status === 'Received' ? '#dcfce7' : '#fef3c7',
                        color: m.status === 'Completed' || m.status === 'Received' ? '#15803d' : '#b45309'
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {m.status !== 'Completed' && m.status !== 'Received' && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'Received')}
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
                          Mark Received ✓
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

      {/* Popup Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="🚛 Request Site Transfer (Current Site → Destination Site)"
        subtitle="Initiate equipment dispatch and track logistics."
      >
        <form onSubmit={handleRequestTransfer}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Select Equipment *</label>
              <select
                value={machineId}
                onChange={e => handleMachineChange(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Choose Equipment ({machines.length}) --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    #{m.machine_no || m.jack_no || m.equipment_code} ({m.machine_type}) - Currently: {m.current_location_name || 'Store'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>From Location / Store *</label>
              <select
                value={fromLocation}
                onChange={e => setFromLocation(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Select Origin Site / Store --</option>
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

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Destination Site / Store *</label>
              <select
                value={toLocation}
                onChange={e => setToLocation(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Select Target Site ({projects.length} sites) --</option>
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

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Transfer Reason</label>
              <input
                type="text"
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                placeholder="e.g. Post-tensioning completed"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Transport Details</label>
              <select
                value={transportDetails}
                onChange={e => setTransportDetails(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="Gulf Transport Heavy Flatbed #4421">Gulf Transport Heavy Flatbed #4421</option>
                <option value="Site Pick-up Truck #102">Site Pick-up Truck #102</option>
                <option value="Direct Crane Carrier">Direct Crane Carrier</option>
                <option value="Self Driven by Operator">Self Driven by Operator</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Handover Dispatcher</label>
              <select
                value={handoverPerson}
                onChange={e => setHandoverPerson(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Choose Supervisor / Dispatcher --</option>
                {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Initiate Transfer →'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EquipmentMovement;
