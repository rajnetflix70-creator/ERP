import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import dayjs from 'dayjs';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ label, value, icon, bgClass, link }) => {
  const content = (
    <div className={`card stat-card ${bgClass}`} style={{ display: 'flex', alignItems: 'center', padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', cursor: link ? 'pointer' : 'default', textDecoration: 'none' }}>
      <div style={{
        width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginRight: '16px',
        backgroundColor: `var(${bgClass}, #f1f5f9)`
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--navy, #1e293b)' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>{label}</div>
      </div>
    </div>
  );

  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link> : content;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projectsCount: 0,
    sitesCount: 0,
    pendingMrCount: 0,
    pendingApprovalsCount: 0,
    openPoCount: 0,
    lowStockCount: 0,
    todayDeliveriesCount: 0,
    employeesCount: 0
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [siteProgressList, setSiteProgressList] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          projRes,
          sitesRes,
          mrRes,
          poRes,
          matRes,
          lowStockRes,
          empRes,
          auditRes
        ] = await Promise.allSettled([
          client.get('/projects?limit=100'),
          client.get('/sites?limit=100'),
          client.get('/material-requests?limit=100'),
          client.get('/procurement/orders?limit=100'),
          client.get('/materials?limit=100'),
          client.get('/materials/low-stock'),
          client.get('/employees?limit=100'),
          client.get('/reports/audit-logs?limit=5')
        ]);

        if (!isMounted) return;

        // Projects
        const projects = projRes.status === 'fulfilled' ? (projRes.value?.data?.data || projRes.value?.data || []) : [];
        const projectsCount = Array.isArray(projects) ? projects.length : (projRes.value?.data?.total || 0);

        // Sites
        const sites = sitesRes.status === 'fulfilled' ? (sitesRes.value?.data?.data || sitesRes.value?.data || []) : [];
        const sitesCount = Array.isArray(sites) ? sites.length : (sitesRes.value?.data?.total || 0);

        // Material Requests
        const mrs = mrRes.status === 'fulfilled' ? (mrRes.value?.data?.data || mrRes.value?.data || []) : [];
        const mrList = Array.isArray(mrs) ? mrs : [];
        const pendingMrs = mrList.filter(m => (m.status || '').toLowerCase() === 'pending');

        // Purchase Orders
        const pos = poRes.status === 'fulfilled' ? (poRes.value?.data?.data || poRes.value?.data || []) : [];
        const poList = Array.isArray(pos) ? pos : [];
        const openPos = poList.filter(p => !['closed', 'completed', 'cancelled'].includes((p.status || '').toLowerCase()));

        // Low stock & Materials
        const lowStock = lowStockRes.status === 'fulfilled' ? (lowStockRes.value?.data?.materials || lowStockRes.value?.data || []) : [];
        const lowStockList = Array.isArray(lowStock) ? lowStock : [];

        // Employees
        const emps = empRes.status === 'fulfilled' ? (empRes.value?.data?.data || empRes.value?.data || []) : [];
        const empCount = Array.isArray(emps) ? emps.length : (empRes.value?.data?.total || 0);

        // Audit logs for activities
        const audits = auditRes.status === 'fulfilled' ? (auditRes.value?.data?.logs || auditRes.value?.data || []) : [];
        const auditList = Array.isArray(audits) ? audits : [];

        setStats({
          projectsCount,
          sitesCount,
          pendingMrCount: pendingMrs.length,
          pendingApprovalsCount: pendingMrs.length,
          openPoCount: openPos.length,
          lowStockCount: lowStockList.length,
          todayDeliveriesCount: 0,
          employeesCount: empCount
        });

        setRecentRequests(mrList.slice(0, 5));
        setLowStockItems(lowStockList.slice(0, 5));
        setRecentActivities(auditList.slice(0, 5));
        setSiteProgressList(sites.slice(0, 4));

      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  const todayDate = dayjs().format('DD MMMM YYYY, dddd');

  // MR Status distribution
  const statusCounts = recentRequests.reduce((acc, curr) => {
    const s = (curr.status || 'pending').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).length > 0 ? [
    { name: 'Pending', value: statusCounts.pending || 0, color: '#3b82f6' },
    { name: 'Approved', value: statusCounts.approved || 0, color: '#22c55e' },
    { name: 'Ordered', value: statusCounts.ordered || 0, color: '#f59e0b' },
    { name: 'Delivered', value: statusCounts.delivered || 0, color: '#4f46e5' },
    { name: 'Rejected', value: statusCounts.rejected || 0, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <div style={{ padding: '24px', backgroundColor: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, color: 'var(--navy, #1e293b)', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Good Morning, {user?.full_name || 'Admin'}
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)' }}>
            Construction Management Dashboard
          </p>
        </div>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary, #64748b)' }}>
          {todayDate}
        </div>
      </div>

      {/* 2. KPI CARDS ROW */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon="📁" value={stats.projectsCount} label="Total Projects" bgClass="--info-lt" link="/projects" />
        <StatCard icon="🏗️" value={stats.sitesCount} label="Active Sites" bgClass="--primary-lt" link="/sites" />
        <StatCard icon="📋" value={stats.pendingMrCount} label="Pending Material Requests" bgClass="--warning-lt" link="/materials/requests" />
        <StatCard icon="✅" value={stats.pendingApprovalsCount} label="Pending Approvals" bgClass="--info-lt" link="/approvals" />
        <StatCard icon="🛒" value={stats.openPoCount} label="Open Purchase Orders" bgClass="--success-lt" link="/procurement/orders" />
        <StatCard icon="⚠️" value={stats.lowStockCount} label="Low Stock Items" bgClass="--danger-lt" link="/inventory" />
        <StatCard icon="🚛" value={stats.todayDeliveriesCount} label="Today's Deliveries" bgClass="--primary-lt" link="/procurement/deliveries" />
        <StatCard icon="👷" value={stats.employeesCount} label="Total Employees" bgClass="--info-lt" link="/hr/employees" />
      </div>

      {/* 3. TWO-COLUMN SECTION: Charts & Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 38%', gap: '2%', marginBottom: '24px' }}>
        
        {/* Material Request Status Distribution */}
        <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--navy, #1e293b)' }}>
            Material Request Status
          </h2>
          {pieData.length > 0 ? (
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '36px', marginBottom: '8px' }}>📊</span>
              <p style={{ margin: 0 }}>No material request data available yet</p>
            </div>
          )}
        </div>

        {/* Site Progress */}
        <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--navy, #1e293b)' }}>
            Active Sites Overview
          </h2>
          {siteProgressList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {siteProgressList.map((site) => {
                const pct = site.progress || site.completion_pct || 0;
                return (
                  <div key={site.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--navy, #1e293b)' }}>{site.name || site.site_name}</span>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary, #2563eb)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '36px', marginBottom: '8px' }}>🏗️</span>
              <p style={{ margin: 0 }}>No active sites created yet</p>
              <Link to="/sites" style={{ marginTop: '8px', color: '#2563eb', fontSize: '0.85rem', fontWeight: '600' }}>+ Add First Site</Link>
            </div>
          )}
        </div>

      </div>

      {/* 4. RECENT MATERIAL REQUESTS TABLE */}
      <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: 'var(--navy, #1e293b)' }}>
            Recent Material Requests
          </h2>
          <Link to="/materials/requests" style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
            View All Requests →
          </Link>
        </div>

        {recentRequests.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary, #64748b)' }}>
                  <th style={{ padding: '10px' }}>MR No</th>
                  <th style={{ padding: '10px' }}>Site</th>
                  <th style={{ padding: '10px' }}>Requested By</th>
                  <th style={{ padding: '10px' }}>Material</th>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#2563eb' }}>{row.mr_number || row.pr_number || row.id.slice(0, 8)}</td>
                    <td style={{ padding: '12px 10px' }}>{row.site_name || row.site || '-'}</td>
                    <td style={{ padding: '12px 10px' }}>{row.requester_name || row.requested_by || 'Staff'}</td>
                    <td style={{ padding: '12px 10px' }}>{row.material_summary || row.notes || 'Items'}</td>
                    <td style={{ padding: '12px 10px' }}>{row.created_at ? dayjs(row.created_at).format('DD MMM YYYY') : '-'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge ${row.status === 'approved' ? 'badge-success' : (row.status === 'rejected' ? 'badge-danger' : 'badge-info')}`} style={{ textTransform: 'capitalize' }}>
                        {row.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>No material requests recorded yet</p>
            <Link to="/materials/requests/new" style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: '600' }}>+ Create First Material Request</Link>
          </div>
        )}
      </div>

      {/* 5. TWO-COLUMN: Recent Activities + Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '50% 48%', gap: '2%' }}>
        
        {/* Recent Activities */}
        <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--navy, #1e293b)' }}>
            Recent Activity Trail
          </h2>
          {recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivities.map((act, i) => (
                <div key={act.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.85rem' }}>
                  <span style={{ backgroundColor: '#eff6ff', padding: '6px', borderRadius: '50%', color: '#2563eb' }}>⚡</span>
                  <div>
                    <div style={{ color: 'var(--navy, #1e293b)', fontWeight: '500' }}>{act.action || act.description}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      {act.user_name || act.user_email || 'System'} • {act.created_at ? dayjs(act.created_at).format('DD MMM, HH:mm') : 'Just now'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ margin: 0 }}>No recent activities logged</p>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--navy, #1e293b)' }}>
            Low Stock Alerts
          </h2>
          {lowStockItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary, #64748b)' }}>
                  <th style={{ padding: '8px' }}>Material</th>
                  <th style={{ padding: '8px' }}>Current</th>
                  <th style={{ padding: '8px' }}>Minimum</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: '500' }}>{item.material_name || item.name}</td>
                    <td style={{ padding: '8px' }}>{item.current_stock || item.stock || 0} {item.unit}</td>
                    <td style={{ padding: '8px' }}>{item.minimum_stock || item.min_stock || 0} {item.unit}</td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge badge-danger">Low</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>✅</span>
              <p style={{ margin: 0 }}>All inventory stock levels are healthy</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
