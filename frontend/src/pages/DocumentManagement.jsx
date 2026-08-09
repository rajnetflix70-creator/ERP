import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [machineId, setMachineId] = useState('');
  const [documentType, setDocumentType] = useState('Calibration Certificate');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, mRes] = await Promise.all([
        apiClient.get('/equipment-machines/documents'),
        apiClient.get('/equipment-machines')
      ]);
      setDocuments(dRes.data || []);
      setMachines(mRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!machineId || !expiryDate) {
      setAlert({ type: 'error', message: 'Select equipment and expiry date.' });
      return;
    }

    try {
      await apiClient.post('/equipment-machines/documents', {
        machine_id: machineId,
        document_type: documentType,
        document_number: documentNumber,
        issue_date: issueDate || null,
        expiry_date: expiryDate,
        notes: notes
      });

      setAlert({ type: 'success', message: 'Document successfully uploaded & compliance tracked!' });
      setMachineId('');
      setDocumentNumber('');
      setNotes('');
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to upload document.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading equipment documents...</div>;

  const expiringSoonCount = documents.filter(d => d.status === 'Expiring Soon').length;
  const expiredCount = documents.filter(d => d.status === 'Expired').length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
        📁 Equipment Document Management & Regulatory Compliance
      </h2>

      {/* Warning Banners for Expiring Documents < 30 days */}
      {(expiringSoonCount > 0 || expiredCount > 0) && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          backgroundColor: '#fff7ed',
          border: '1px solid #ffedd5',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong style={{ color: '#c2410c', fontSize: '1rem' }}>Compliance Alert!</strong>
            <div style={{ fontSize: '0.85rem', color: '#9a3412', marginTop: '0.15rem' }}>
              You have <strong>{expiringSoonCount} document(s) expiring within 30 days</strong> and <strong>{expiredCount} expired document(s)</strong> requiring immediate renewal.
            </div>
          </div>
        </div>
      )}

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

      {/* Document Upload Form */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Upload / Track New Document
        </h3>

        <form onSubmit={handleUploadDocument} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Document Type</label>
            <select
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Calibration Certificate">Calibration Certificate</option>
              <option value="Fitness Certificate">Fitness Certificate</option>
              <option value="Insurance Policy">Insurance Policy</option>
              <option value="Registration (RC)">Registration (RC)</option>
              <option value="Pollution Certificate">Pollution Certificate</option>
              <option value="Rental Agreement">Rental Agreement</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Document / Certificate #</label>
            <input
              type="text"
              placeholder="e.g. CAL-2026-9901"
              value={documentNumber}
              onChange={e => setDocumentNumber(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Expiry Date *</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Notes / Authority</label>
            <input
              type="text"
              placeholder="e.g. Dubai Municipality Approved"
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
              Upload & Track Document
            </button>
          </div>
        </form>
      </div>

      {/* Document Vault Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Equipment Document Vault & Expiry Tracker
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Document Type</th>
                <th style={{ padding: '0.75rem' }}>Machine</th>
                <th style={{ padding: '0.75rem' }}>Document #</th>
                <th style={{ padding: '0.75rem' }}>Issue Date</th>
                <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{d.document_type}</td>
                  <td style={{ padding: '0.75rem' }}>#{d.machine_no || 'EQ'} ({d.machine_type})</td>
                  <td style={{ padding: '0.75rem' }}>{d.document_number || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{d.issue_date ? new Date(d.issue_date).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: d.status === 'Valid' ? '#dcfce7' : d.status === 'Expiring Soon' ? '#ffedd5' : '#fee2e2',
                      color: d.status === 'Valid' ? '#15803d' : d.status === 'Expiring Soon' ? '#c2410c' : '#b91c1c'
                    }}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => alert(`Downloading ${d.document_type} PDF simulation...`)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.8rem',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Download
                    </button>
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

export default DocumentManagement;
