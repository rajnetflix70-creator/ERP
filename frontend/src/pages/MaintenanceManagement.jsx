import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const MaintenanceManagement = () => {
  const [maintenance, setMaintenance] = useState([]);
  const [machines, setMachines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [machineId, setMachineId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('Preventive Maintenance');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [meterReading, setMeterReading] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [technician, setTechnician] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, macRes, vRes] = await Promise.all([
        apiClient.get('/equipment-machines/maintenance'),
        apiClient.get('/equipment-machines'),
        apiClient.get('/equipment-machines/vendors')
      ]);
      setMaintenance(mRes.data || []);
      setMachines(macRes.data || []);
      setVendors(vRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    if (!machineId || !serviceDate) {
      setAlert({ type: 'error', message: 'Select machine and service date.' });
      return;
    }

    try {
      await apiClient.post('/equipment-machines/maintenance', {
        machine_id: machineId,
        maintenance_type: maintenanceType,
        service_date: serviceDate,
        meter_reading: parseFloat(meterReading) || 0,
        problem_description: problemDescription,
        work_performed: workPerformed,
        vendor_id: vendorId || null,
        technician: technician,
        parts_used: partsUsed,
        labor_cost: parseFloat(laborCost) || 0,
        parts_cost: parseFloat(partsCost) || 0,
        next_service_date: nextServiceDate || null
      });

      setAlert({ type: 'success', message: 'Maintenance record saved & next service scheduled!' });
      setMachineId('');
      setProblemDescription('');
      setWorkPerformed('');
      setLaborCost('');
      setPartsCost('');
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to log maintenance.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading maintenance records...</div>;

  const totalSpent = maintenance.reduce((acc, curr) => acc + (parseFloat(curr.total_cost) || 0), 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
        🔧 Maintenance Management & Service Work Orders
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Total Maintenance Logged</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>{maintenance.length}</div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Total Maintenance Expenditure</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#16a34a', marginTop: '0.2rem' }}>AED {totalSpent.toLocaleString()}</div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Active Vendors</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#2563eb', marginTop: '0.2rem' }}>{vendors.length}</div>
        </div>
      </div>

      {/* Maintenance Entry Form */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Log Maintenance Work Order / Service
        </h3>

        <form onSubmit={handleCreateMaintenance} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Equipment *</label>
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Maintenance Type</label>
            <select
              value={maintenanceType}
              onChange={e => setMaintenanceType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Preventive Maintenance">Preventive Maintenance</option>
              <option value="Corrective Maintenance">Corrective Maintenance</option>
              <option value="Inspection">Inspection & Calibration</option>
              <option value="General Service">General Service</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Service Date *</label>
            <input
              type="date"
              value={serviceDate}
              onChange={e => setServiceDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Service Vendor</label>
            <select
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="">-- In-House / External Vendor --</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.vendor_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Technician Name</label>
            <input
              type="text"
              placeholder="e.g. Eng. Hassan Raza"
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Next Service Date</label>
            <input
              type="date"
              value={nextServiceDate}
              onChange={e => setNextServiceDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Labor Cost (AED)</label>
            <input
              type="number"
              placeholder="e.g. 450"
              value={laborCost}
              onChange={e => setLaborCost(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Parts Cost (AED)</label>
            <input
              type="number"
              placeholder="e.g. 850"
              value={partsCost}
              onChange={e => setPartsCost(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Parts / Spares Replaced</label>
            <input
              type="text"
              placeholder="e.g. High pressure seal kit"
              value={partsUsed}
              onChange={e => setPartsUsed(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Work Performed Description</label>
            <textarea
              rows={2}
              placeholder="Detailed explanation of work completed..."
              value={workPerformed}
              onChange={e => setWorkPerformed(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Submit Maintenance Record
            </button>
          </div>
        </form>
      </div>

      {/* Maintenance History Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Maintenance History Log
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Service Date</th>
                <th style={{ padding: '0.75rem' }}>Machine</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Work Performed</th>
                <th style={{ padding: '0.75rem' }}>Vendor / Tech</th>
                <th style={{ padding: '0.75rem' }}>Total Cost</th>
                <th style={{ padding: '0.75rem' }}>Next Service</th>
              </tr>
            </thead>
            <tbody>
              {maintenance.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>{m.service_date ? new Date(m.service_date).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>#{m.machine_no || 'EQ'} ({m.machine_type})</td>
                  <td style={{ padding: '0.75rem' }}>{m.maintenance_type}</td>
                  <td style={{ padding: '0.75rem' }}>{m.work_performed || m.problem_description}</td>
                  <td style={{ padding: '0.75rem' }}>{m.vendor_name || m.technician || 'In-House'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '700', color: '#16a34a' }}>AED {parseFloat(m.total_cost || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', color: '#2563eb' }}>{m.next_service_date ? new Date(m.next_service_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceManagement;
