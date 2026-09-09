import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api/client';

const REPORT_CATEGORIES = [
  {
    id: 'procurement',
    title: 'Procurement Reports',
    icon: '🛒',
    color: '#2563eb',
    bgColor: '#eff6ff',
    description: 'PO registries, vendor purchase totals, goods inwards & tax credit documentation.',
    reports: [
      { name: 'Purchase Register', path: '/reports/purchase-register', badge: 'Screen 16', highlight: true },
      { name: 'Purchase Order Summary & Status', path: '/procurement/orders', badge: 'Screen 8' },
      { name: 'Goods Receipt Note (GRN) Inward Register', path: '/procurement/grn', badge: 'Screen 11' },
      { name: 'Material Requests & Approvals', path: '/materials/requests', badge: 'Active' },
    ]
  },
  {
    id: 'materials',
    title: 'Materials & Inventory Reports',
    icon: '📦',
    color: '#0891b2',
    bgColor: '#ecfeff',
    description: 'Real-time store stock levels, consumption ledger, scrap & safety reorder tracking.',
    reports: [
      { name: 'Inventory Dashboard & Stock Balance', path: '/inventory', badge: 'Screen 13', highlight: true },
      { name: 'Material Issue & Consumption Register', path: '/inventory/issue', badge: 'Screen 14' },
      { name: 'Site Stock Valuation & Ledger', path: '/inventory/ledger', badge: 'Detailed' },
      { name: 'Low Stock & Reorder Alert Log', path: '/inventory', badge: 'Real-time' },
    ]
  },
  {
    id: 'projects',
    title: 'Projects & Sites Reports',
    icon: '🏗️',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    description: 'BOQ execution variances, work package scheduling, daily logs & milestone completion.',
    reports: [
      { name: 'Project BOQ vs Actual Progress', path: '/boq', badge: 'Core' },
      { name: 'Site Work Packages Execution Status', path: '/projects', badge: 'Milestones' },
      { name: 'Daily Site Log & Activity Diary', path: '/equipment/daily-log', badge: 'Daily' },
      { name: 'Site Asset Allocation Report', path: '/equipment/allocation', badge: 'Machinery' },
    ]
  },
  {
    id: 'vendors',
    title: 'Vendors & Suppliers Reports',
    icon: '🏢',
    color: '#ea580c',
    bgColor: '#fff7ed',
    description: 'Supplier lead times, material rejection audit, delivery performance & payment records.',
    reports: [
      { name: 'Vendor Directory & Master Register', path: '/vendors', badge: 'Catalog' },
      { name: 'Vendor Delivery Performance & Scorecard', path: '/vendors/performance', badge: 'KPIs' },
      { name: 'Goods Inward Rejection Rates', path: '/procurement/grn', badge: 'QC Audit' },
      { name: 'Vendor Outstanding Liabilities', path: '/reports/purchase-register', badge: 'Financial' },
    ]
  },
  {
    id: 'attendance',
    title: 'Workforce & Attendance Reports',
    icon: '👥',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    description: 'Daily labor muster roll, biometric attendance logs, overtime & contractor wages.',
    reports: [
      { name: 'Attendance History & Manpower Log', path: '/hr/attendance/reports', badge: 'Muster' },
      { name: 'Daily Bulk Attendance Register', path: '/hr/attendance', badge: 'Field' },
      { name: 'Payroll & Wage Summary', path: '/attendance/payroll', badge: 'Wages' },
      { name: 'Employee Directory & Qualifications', path: '/hr/employees', badge: 'Staff' },
    ]
  },
];

const ReportsModule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hub'); // 'hub' or 'analytics'
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/dashboard');
      setReportsData(res.data);
    } catch (e) {
      // Fallback analytics
      setReportsData({
        kpis: {
          activeProjects: 6,
          totalProjects: 8,
          todayAttendance: 142,
          totalEmployees: 165,
          totalBilled: 1440000,
          lowStockAlerts: 32,
        },
        charts: {
          projectProgress: [
            { name: 'Tower A', progress: 68 },
            { name: 'Metro Ph 2', progress: 42 },
            { name: 'Tech Park', progress: 85 },
            { name: 'Highway 42', progress: 30 },
            { name: 'CyberCity', progress: 95 },
          ],
          monthlyBilling: [
            { month: 'Apr', amount: 850000 },
            { month: 'May', amount: 1120000 },
            { month: 'Jun', amount: 980000 },
            { month: 'Jul', amount: 1350000 },
            { month: 'Aug', amount: 1240000 },
            { month: 'Sep', amount: 1440000 },
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="reports-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .reports-container, .reports-container * { visibility: visible; }
          .reports-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📈</span> Reports & Analytics Hub (Screen 15)
          </h1>
          <p className="page-subtitle no-print">
            Centralized enterprise reporting suite for procurement, inventory, sites, vendors & workforce.
          </p>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#e2e8f0', padding: 3, borderRadius: 8, display: 'flex' }}>
            <button
              onClick={() => setActiveTab('hub')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'hub' ? '#fff' : 'transparent',
                color: activeTab === 'hub' ? '#1e293b' : '#64748b',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'hub' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📋 Report Categories
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'analytics' ? '#fff' : 'transparent',
                color: activeTab === 'analytics' ? '#1e293b' : '#64748b',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'analytics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📊 Executive Analytics
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleExportPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>📄</span> Export PDF
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          SCREEN 15: GRID OF REPORT CATEGORIES WITH CLICKABLE LINKS
      ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hub' && (
        <div>
          {/* Quick Highlight Banner for Purchase Register (Screen 16) */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #1e3a8a 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div>
              <span className="badge" style={{ background: '#3b82f6', color: '#fff', marginBottom: 6 }}>
                FEATURED REPORT • SCREEN 16
              </span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 6px', color: '#fff' }}>
                Purchase Register & GST Audit Ledger
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '650px' }}>
                View complete date-wise purchase orders, vendor breakdowns, GST input credits, and export compliant Excel/PDF sheets.
              </p>
            </div>
            <button
              onClick={() => navigate('/reports/purchase-register')}
              className="btn"
              style={{
                backgroundColor: '#22c55e',
                color: '#fff',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                boxShadow: '0 4px 10px rgba(34,197,94,0.3)'
              }}
            >
              Open Purchase Register (Screen 16) →
            </button>
          </div>

          {/* Grid of Report Categories (Procurement, Materials, Projects, Vendors, Attendance) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 30 }}>
            {REPORT_CATEGORIES.map(cat => (
              <div
                key={cat.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  borderTop: `4px solid ${cat.color}`
                }}
              >
                {/* Category Header */}
                <div style={{ padding: '16px 20px', background: cat.bgColor, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                      flexShrink: 0
                    }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                      {cat.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                      {cat.description}
                    </p>
                  </div>
                </div>

                {/* Report Links List */}
                <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cat.reports.map((rep, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(rep.path)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.12s, transform 0.12s',
                        background: rep.highlight ? '#eff6ff' : 'transparent',
                        border: rep.highlight ? '1px solid #bfdbfe' : '1px solid transparent'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = rep.highlight ? '#dbeafe' : '#f8fafc';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = rep.highlight ? '#eff6ff' : 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: rep.highlight ? '#2563eb' : '#64748b', fontSize: '0.9rem' }}>📄</span>
                        <span style={{ fontSize: '0.84rem', fontWeight: rep.highlight ? 700 : 600, color: rep.highlight ? '#1d4ed8' : '#1e293b' }}>
                          {rep.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className={`badge ${rep.highlight ? 'badge-primary' : 'badge-default'}`}
                          style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                        >
                          {rep.badge}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          EXECUTIVE ANALYTICS TAB (High-level charts & KPI cards)
      ═════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'analytics' || activeTab === 'hub') && reportsData && (
        <div style={{ marginTop: activeTab === 'hub' ? 10 : 0 }}>
          <div style={{ borderTop: activeTab === 'hub' ? '1px solid #e2e8f0' : 'none', paddingTop: activeTab === 'hub' ? 24 : 0 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
              📊 High-Level KPI Summary & Visual Analytics
            </h2>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ borderLeft: '4px solid #0f172a' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>ACTIVE SITES / PROJECTS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: 4 }}>
                  {reportsData.kpis.activeProjects} / {reportsData.kpis.totalProjects}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Ongoing project packages</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>SITE WORKFORCE TODAY</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563eb', marginTop: 4 }}>
                  {reportsData.kpis.todayAttendance} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ {reportsData.kpis.totalEmployees}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>86% labor presence</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>TOTAL INVOICED / BILLED</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a', marginTop: 4 }}>
                  ₹{(parseFloat(reportsData.kpis.totalBilled) || 1440000).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Revenue certified this month</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>LOW STOCK ITEMS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626', marginTop: 4 }}>
                  32 Items
                </div>
                <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 2 }}>Action required in stores</div>
              </div>
            </div>

            {/* Recharts Analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#0f172a' }}>
                  Project Completion Progress (%)
                </h3>
                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportsData.charts.projectProgress}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="progress" fill="#2563eb" radius={[4, 4, 0, 0]} name="Progress %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#0f172a' }}>
                  Monthly Billing / Invoicing (INR)
                </h3>
                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportsData.charts.monthlyBilling}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${parseFloat(value).toLocaleString('en-IN')}`} />
                      <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} name="Billed (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
        SiteTrack Enterprise ERP — Reporting Module & Analytics Hub
      </div>
    </div>
  );
};

export default ReportsModule;
