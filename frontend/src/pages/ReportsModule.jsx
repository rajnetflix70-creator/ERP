import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
      const res = await apiClient.get('/reports/dashboard');
      setReportsData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Generating Analytics & Reports...</div>;

  if (!reportsData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Error loading data.</div>;

  const { kpis, charts } = reportsData;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899'];

  return (
    <div className="reports-container" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .reports-container, .reports-container * { visibility: visible; }
          .reports-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            📊 Enterprise Analytics Dashboard
          </h2>
          <p className="page-subtitle no-print">Project progress, expenses, workforce, and performance.</p>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleExportPDF}
            style={{ padding: '0.6rem 1.2rem', backgroundColor: '#dc2626', color: '#fff', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Active Projects</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>
            {kpis.activeProjects} / {kpis.totalProjects}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Workforce Today</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#2563eb', marginTop: '0.2rem' }}>
            {kpis.todayAttendance} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {kpis.totalEmployees}</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Total Invoiced</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#16a34a', marginTop: '0.2rem' }}>
            AED {parseFloat(kpis.totalBilled).toLocaleString()}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Low Stock Alerts</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#dc2626', marginTop: '0.2rem' }}>
            {kpis.lowStockAlerts} Items
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.5rem', color: '#0f172a' }}>
            Project Completion Progress (%)
          </h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.projectProgress}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="progress" fill="#2563eb" radius={[4, 4, 0, 0]} name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {charts.projectProgress.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No active projects data.</p>}
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.5rem', color: '#0f172a' }}>
            Monthly Invoicing / Revenue
          </h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyBilling}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => `AED ${parseFloat(value).toLocaleString()}`} />
                <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} name="Total Billed (AED)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {charts.monthlyBilling.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No billing data available.</p>}
        </div>
      </div>
      
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '2rem' }}>
        Report generated on {new Date().toLocaleString()} by SiteTrack ERP
      </div>
    </div>
  );
};

export default ReportsModule;
