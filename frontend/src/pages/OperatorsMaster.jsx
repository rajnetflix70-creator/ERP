import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const OperatorsMaster = () => {
  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState('Heavy Equipment & Crane');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [assignedMachineId, setAssignedMachineId] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oRes, mRes] = await Promise.all([
        apiClient.get('/equipment-machines/operators'),
        apiClient.get('/equipment-machines')
      ]);
      setOperators(Array.isArray(oRes?.data) ? oRes.data : []);
      setMachines(Array.isArray(mRes?.data) ? mRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    if (!employeeId || !name) {
      setAlert({ type: 'error', message: 'Employee ID and Name are required.' });
      return;
    }

    try {
      await apiClient.post('/equipment-machines/operators', {
        employee_id: employeeId,
        name: name,
        mobile: mobile,
        license_number: licenseNumber,
        license_type: licenseType,
        license_expiry: licenseExpiry || null,
        assigned_machine_id: assignedMachineId || null
      });

      setAlert({ type: 'success', message: 'Operator successfully created!' });
      setEmployeeId('');
      setName('');
      setMobile('');
      setLicenseNumber('');
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to create operator.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading operator directory...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
        👷 Equipment Operators Master
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

      {/* Operator Add Form */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Register New Equipment Operator
        </h3>

        <form onSubmit={handleCreateOperator} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Employee ID *</label>
            <input
              type="text"
              placeholder="e.g. OP-1005"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Operator Name *</label>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Mobile Number</label>
            <input
              type="text"
              placeholder="+971 50 xxx xxxx"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>License Number</label>
            <input
              type="text"
              placeholder="e.g. UAE-LIC-9981"
              value={licenseNumber}
              onChange={e => setLicenseNumber(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>License Category</label>
            <select
              value={licenseType}
              onChange={e => setLicenseType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Heavy Equipment & Crane">Heavy Equipment & Crane</option>
              <option value="Stressing Machine Operator">Stressing Machine Operator</option>
              <option value="Grouting & Hydraulic Specialist">Grouting & Hydraulic Specialist</option>
              <option value="General Machinery">General Machinery</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>License Expiry Date</label>
            <input
              type="date"
              value={licenseExpiry}
              onChange={e => setLicenseExpiry(e.target.value)}
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
              Save Operator Details
            </button>
          </div>
        </form>
      </div>

      {/* Operators Directory Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Registered Operators & License Tracking
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Emp ID</th>
                <th style={{ padding: '0.75rem' }}>Operator Name</th>
                <th style={{ padding: '0.75rem' }}>Mobile</th>
                <th style={{ padding: '0.75rem' }}>License #</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>License Expiry</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(operators) ? operators : []).map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{o.employee_id}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '600', color: '#0f172a' }}>{o.name}</td>
                  <td style={{ padding: '0.75rem' }}>{o.mobile || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{o.license_number || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{o.license_type}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{o.license_expiry ? new Date(o.license_expiry).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#dcfce7',
                      color: '#15803d'
                    }}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperatorsMaster;
