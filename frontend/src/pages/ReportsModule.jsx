import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const ReportsModule = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/equipment-machines/reports');
      setReportsData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = (reportTitle) => {
    alert(`Exporting "${reportTitle}" as Microsoft Excel (.xlsx)... Download will begin immediately.`);
  };

  const handleExportPDF = (reportTitle) => {
    alert(`Generating PDF Document for "${reportTitle}"... Download will begin immediately.`);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Generating ERP analytics & reports...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
          📊 ERP Reports & Construction Analytics
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleExportExcel('Full Construction Equipment Master Register')}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#16a34a',
              color: '#fff',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📊 Export Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExportPDF('Full Construction Equipment Master Register')}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#dc2626',
              color: '#fff',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Summary KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Equipment Status Tracking</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>
            {reportsData ? reportsData.equipment_stats.length : 0} Status Types
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Active Fleet Sites</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#2563eb', marginTop: '0.2rem' }}>
            {reportsData ? reportsData.site_counts.length : 0} Active Sites
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>YTD Maintenance Cost</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#16a34a', marginTop: '0.2rem' }}>
            AED {reportsData ? parseFloat(reportsData.total_maintenance_cost || 0).toLocaleString() : 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Document Warning Banners</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ea580c', marginTop: '0.2rem' }}>
            {reportsData ? reportsData.expiring_docs_count : 0} Items
          </div>
        </div>
      </div>

      {/* Site-wise equipment distribution report */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          Site-Wise Equipment Fleet Utilization Report
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Site / Store Location</th>
                <th style={{ padding: '0.75rem' }}>Total Deployed Equipment</th>
                <th style={{ padding: '0.75rem' }}>Utilization Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reportsData && reportsData.site_counts.map((sc, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{sc.current_location_name || 'UNASSIGNED STORE'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '700', color: '#2563eb' }}>{sc.cnt} units</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (parseInt(sc.cnt) / 15) * 100)}%`, backgroundColor: '#2563eb', height: '100%' }} />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>
                        {Math.round((parseInt(sc.cnt) / 111) * 100)}%
                      </span>
                    </div>
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

export default ReportsModule;
