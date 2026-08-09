import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const VendorsMaster = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vendorName, setVendorName] = useState('');
  const [vendorType, setVendorType] = useState('Equipment Rental');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [equipmentService, setEquipmentService] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vRes = await apiClient.get('/equipment-machines/vendors');
      setVendors(vRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!vendorName) {
      setAlert({ type: 'error', message: 'Vendor Name is required.' });
      return;
    }

    try {
      await apiClient.post('/equipment-machines/vendors', {
        vendor_name: vendorName,
        vendor_type: vendorType,
        contact_person: contactPerson,
        mobile: mobile,
        email: email,
        address: address,
        equipment_service: equipmentService
      });

      setAlert({ type: 'success', message: 'Vendor successfully registered!' });
      setVendorName('');
      setContactPerson('');
      setMobile('');
      setEmail('');
      setEquipmentService('');
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to create vendor.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading vendor directory...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
        🏢 Vendor Management (Rentals, Maintenance, Transport)
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

      {/* Vendor Add Form */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Add Vendor / Equipment Service Provider
        </h3>

        <form onSubmit={handleCreateVendor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Vendor Name *</label>
            <input
              type="text"
              placeholder="Company Name"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Vendor Category</label>
            <select
              value={vendorType}
              onChange={e => setVendorType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Equipment Rental">Equipment Rental</option>
              <option value="Maintenance">Maintenance & Calibration</option>
              <option value="Spare Parts">Spare Parts</option>
              <option value="Transport">Transport & Logistics</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Contact Person</label>
            <input
              type="text"
              placeholder="Name"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Mobile</label>
            <input
              type="text"
              placeholder="+971 4 xxx xxxx"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Email</label>
            <input
              type="email"
              placeholder="info@vendor.ae"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Services Offered</label>
            <input
              type="text"
              placeholder="e.g. Hydraulic Pumps & Heavy Trailers"
              value={equipmentService}
              onChange={e => setEquipmentService(e.target.value)}
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
              Save Vendor Record
            </button>
          </div>
        </form>
      </div>

      {/* Vendor Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Vendor Directory ({vendors.length})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Vendor Name</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Contact Person</th>
                <th style={{ padding: '0.75rem' }}>Mobile / Email</th>
                <th style={{ padding: '0.75rem' }}>Services Provided</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0f172a' }}>{v.vendor_name}</td>
                  <td style={{ padding: '0.75rem' }}>{v.vendor_type}</td>
                  <td style={{ padding: '0.75rem' }}>{v.contact_person || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{v.mobile} <br/><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{v.email}</span></td>
                  <td style={{ padding: '0.75rem' }}>{v.equipment_service || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#dcfce7',
                      color: '#15803d'
                    }}>
                      ACTIVE
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

export default VendorsMaster;
