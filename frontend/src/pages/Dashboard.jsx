import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const StatCard = ({ label, value, icon, bgClass }) => (
  <div className={`card stat-card ${bgClass}`} style={{ display: 'flex', alignItems: 'center', padding: '20px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
    <div style={{
      width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginRight: '16px',
      backgroundColor: `var(${bgClass})`
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--navy, #1e293b)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>{label}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // API State (optional, using hardcoded as fallback)
  const [mrCount, setMrCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const mrRes = await client.get('/material-requests?limit=100');
        const mrData = mrRes.data?.data || mrRes.data || [];
        setMrCount(mrData.length);
      } catch (err) {
        console.error('API load error', err);
      }
    };
    load();
  }, []);

  const todayDate = dayjs().format('DD MMMM YYYY, dddd');

  // Chart Data
  const pieData = [
    { name: 'Pending', value: 24, color: '#3b82f6' },
    { name: 'Approved', value: 18, color: '#22c55e' },
    { name: 'Ordered', value: 12, color: '#f59e0b' },
    { name: 'Delivered', value: 45, color: '#4f46e5' },
    { name: 'Rejected', value: 5, color: '#ef4444' },
  ];

  const barData = [
    { month: 'Jan', amount: 5 },
    { month: 'Feb', amount: 8 },
    { month: 'Mar', amount: 6 },
    { month: 'Apr', amount: 12 },
    { month: 'May', amount: 10 },
    { month: 'Jun', amount: 15 },
    { month: 'Jul', amount: 14 },
    { month: 'Aug', amount: 9 },
    { month: 'Sep', amount: 11 },
  ];

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
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon="📁" value="12" label="Total Projects" bgClass="--info-lt" />
        <StatCard icon="🏗️" value="8" label="Active Sites" bgClass="--primary-lt" />
        <StatCard icon="📋" value={mrCount > 24 ? mrCount : 24} label="Pending Material Requests" bgClass="--warning-lt" />
        <StatCard icon="✅" value="7" label="Pending Approvals" bgClass="--info-lt" />
        <StatCard icon="🛒" value="15" label="Open Purchase Orders" bgClass="--success-lt" />
        <StatCard icon="⚠️" value="32" label="Low Stock Items" bgClass="--danger-lt" />
        <StatCard icon="🚛" value="14" label="Today's Deliveries" bgClass="--primary-lt" />
        <StatCard icon="👷" value="156" label="Total Employees" bgClass="--info-lt" />
      </div>

      {/* 3. TWO-COLUMN SECTION: Charts */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ flex: '0 0 60%', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--navy, #1e293b)', fontSize: '1.1rem' }}>Material Request Status</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ flex: '0 0 calc(40% - 24px)', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--navy, #1e293b)', fontSize: '1.1rem' }}>Site Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {[
              { name: 'Tower A', progress: 62 },
              { name: 'Tower B', progress: 48 },
              { name: 'Villa Project', progress: 75 },
              { name: 'Warehouse', progress: 35 },
            ].map(site => (
              <div key={site.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary, #64748b)' }}>
                  <span>{site.name}</span>
                  <span>{site.progress}%</span>
                </div>
                <div className="progress-bar" style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${site.progress}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. PURCHASE OVERVIEW */}
      <div className="card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--navy, #1e293b)', fontSize: '1.1rem' }}>Monthly Purchase Overview (in Lakhs)</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. RECENT MATERIAL REQUESTS TABLE */}
      <div className="card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--navy, #1e293b)', fontSize: '1.1rem', marginBottom: '16px' }}>Recent Material Requests</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted, #94a3b8)' }}>
                <th style={{ padding: '12px' }}>MR No</th>
                <th style={{ padding: '12px' }}>Site</th>
                <th style={{ padding: '12px' }}>Requested By</th>
                <th style={{ padding: '12px' }}>Material</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mr: 'MR-1024', site: 'Tower A', by: 'Suresh Kumar', mat: 'OPC Cement', amt: '₹2,50,000', date: '09 Sep 2026', status: 'Pending', badge: 'badge-info' },
                { mr: 'MR-1023', site: 'Tower B', by: 'Rajesh Babu', mat: 'TMT 12mm', amt: '₹5,80,000', date: '08 Sep 2026', status: 'Approved', badge: 'badge-success' },
                { mr: 'MR-1022', site: 'Villa Project', by: 'Arun Kumar', mat: 'M-Sand', amt: '₹1,20,000', date: '08 Sep 2026', status: 'Ordered', badge: 'badge-warning' },
                { mr: 'MR-1021', site: 'Warehouse', by: 'Prakash S', mat: 'Bricks', amt: '₹45,000', date: '07 Sep 2026', status: 'Delivered', badge: 'badge-success' },
                { mr: 'MR-1020', site: 'Tower A', by: 'Suresh Kumar', mat: 'Paint', amt: '₹3,10,000', date: '06 Sep 2026', status: 'Rejected', badge: 'badge-danger' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: '600', color: '#2563eb' }}>{row.mr}</td>
                  <td style={{ padding: '12px', color: 'var(--navy, #1e293b)' }}>{row.site}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary, #64748b)' }}>{row.by}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary, #64748b)' }}>{row.mat}</td>
                  <td style={{ padding: '12px', fontWeight: '500', color: 'var(--navy, #1e293b)' }}>{row.amt}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted, #94a3b8)' }}>{row.date}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${row.badge}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. TWO-COLUMN: Recent Activities + Low Stock */}
      <div style={{ display: 'flex', gap: '24px' }}>
        <div className="card" style={{ flex: '1', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--navy, #1e293b)', fontSize: '1.1rem', marginBottom: '16px' }}>Recent Activities</h3>
          <div className="timeline" style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #e2e8f0' }}>
            {[
              'MR-1024 submitted by Suresh Kumar',
              'PO-2045 approved by Project Manager',
              'GRN-501 received at Tower A',
              'Material issued to Tower B',
              'Attendance submitted for Tower A'
            ].map((activity, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '16px' }}>
                <span style={{ position: 'absolute', left: '-25px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb', border: '2px solid #fff' }}></span>
                <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: '0.9rem' }}>{activity}</p>
                <small style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem' }}>{i + 1} hour{i > 0 ? 's' : ''} ago</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: '1', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--navy, #1e293b)', fontSize: '1.1rem', marginBottom: '16px' }}>Low Stock Alerts</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted, #94a3b8)' }}>
                <th style={{ padding: '8px' }}>Material</th>
                <th style={{ padding: '8px' }}>Current</th>
                <th style={{ padding: '8px' }}>Minimum</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mat: 'OPC Cement', cur: '50 Bags', min: '200 Bags', status: 'Critical', badge: 'badge-danger' },
                { mat: 'TMT 12mm', cur: '2 MT', min: '5 MT', status: 'Low', badge: 'badge-warning' },
                { mat: 'M-Sand', cur: '8 Ton', min: '15 Ton', status: 'Low', badge: 'badge-warning' },
                { mat: 'PVC Pipe', cur: '20 Nos', min: '50 Nos', status: 'Critical', badge: 'badge-danger' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--navy, #1e293b)' }}>{row.mat}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary, #64748b)' }}>{row.cur}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary, #64748b)' }}>{row.min}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${row.badge}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {row.status}
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

export default Dashboard;
