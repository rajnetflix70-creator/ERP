import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';

/* ─────────────────────────────────────────────
   ANIMATED COUNTER HOOK
───────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ label, value, icon, gradient, trend, sub, onClick }) => {
  const animated = useCountUp(Number(value) || 0);
  return (
    <div onClick={onClick}
      style={{
        background: gradient, borderRadius: '10px', padding: '20px 24px',
        color: '#fff', cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative',
        overflow: 'hidden', minHeight: '90px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.22)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
    >
      {/* Background Icon */}
      <span style={{ position: 'absolute', right: '16px', top: '12px', fontSize: '44px', opacity: 0.18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1.1 }}>{animated.toLocaleString()}</div>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginTop: '4px' }}>{label}</div>
      </div>
      {sub && <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>{sub}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
const Badge = ({ label }) => {
  const colors = {
    'Pending': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'Pending / Delivery Pending': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'Approved': { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    'Approved / Delivered': { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    'Approved / Partially Delivered': { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
    'Rejected': { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
    'Delivered': { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  };
  const style = colors[label] || { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
  return (
    <span style={{
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
      borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap'
    }}>{label}</span>
  );
};

/* ─────────────────────────────────────────────
   SECTION CARD WRAPPER
───────────────────────────────────────────── */
const Card = ({ title, headerRight, children, style = {} }) => (
  <div style={{
    background: '#fff', borderRadius: '10px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', ...style
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 18px', borderBottom: '1px solid #f1f5f9',
      background: 'linear-gradient(90deg,#f8fafc,#fff)'
    }}>
      <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', letterSpacing: '0.3px' }}>{title}</span>
      {headerRight && <span style={{ fontSize: '12px', color: '#64748b' }}>{headerRight}</span>}
    </div>
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   RECHARTS CUSTOM TOOLTIP
───────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <div style={{ fontWeight: '700', marginBottom: '4px', color: '#94a3b8' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff' }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // KPI counters
  const [kpi, setKpi] = useState({ totalMR: 0, pendingApproval: 0, totalReceived: 0, pendingReady: 0 });
  // Table data
  const [recentMR, setRecentMR] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  // Chart data
  const [areaData, setAreaData] = useState([]);
  const [pieConsumption, setPieConsumption] = useState([]);
  const [donutStock, setDonutStock] = useState([]);

  const COLORS = ['#ef4444', '#f97316', '#22d3ee', '#22c55e', '#8b5cf6', '#3b82f6'];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '☀️ Good Morning';
    if (h < 18) return '🌤️ Good Afternoon';
    return '🌙 Good Evening';
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // --- Material Requests ---
        let mrData = [];
        try {
          const mrRes = await client.get('/material-requests?limit=100');
          mrData = mrRes.data?.data || mrRes.data || [];
        } catch { mrData = []; }

        const total = mrData.length;
        const pending = mrData.filter(r => (r.status || '').toLowerCase().includes('pending')).length;
        const received = mrData.filter(r => (r.status || '').toLowerCase().includes('delivered')).length;
        const ready = mrData.filter(r => (r.status || '').toLowerCase().includes('approved') && !(r.status || '').toLowerCase().includes('delivered')).length;

        setKpi({ totalMR: total, pendingApproval: pending, totalReceived: received, pendingReady: ready });

        // Recent 5
        setRecentMR(mrData.slice(0, 5).map((r, i) => ({
          sn: i + 1,
          jobNo: r.job_number || r.job_no || `JOB-${i + 1}`,
          location: r.location || r.site_location || '—',
          required: r.required_date || r.created_at?.slice(0, 10) || '—',
          status: r.status || 'Pending'
        })));

        // Area chart — group by month
        const monthMap = {};
        mrData.forEach(r => {
          const mo = (r.created_at || '').slice(0, 7);
          if (mo) { monthMap[mo] = (monthMap[mo] || 0) + 1; }
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sortedKeys = Object.keys(monthMap).sort();
        setAreaData(sortedKeys.map(k => ({
          month: months[parseInt(k.slice(5, 7)) - 1] || k,
          requests: monthMap[k]
        })));

        // Pie — status breakdown
        const statusMap = {};
        mrData.forEach(r => { const s = r.status || 'Unknown'; statusMap[s] = (statusMap[s] || 0) + 1; });
        setPieConsumption(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

        // --- Materials/Stock ---
        let matData = [];
        try {
          const matRes = await client.get('/materials?limit=100');
          matData = matRes.data?.data || matRes.data || [];
        } catch { matData = []; }

        setStockItems(matData.slice(0, 5).map((m, i) => ({
          sn: i + 1,
          code: m.code || m.material_code || `MAT-${i + 1}`,
          name: m.name || m.material_name || '—',
          brand: m.brand_name || m.brand || '—',
          currentStock: m.current_stock ?? m.quantity ?? '—'
        })));

        // Donut — stock categories
        const catMap = {};
        matData.forEach(m => { const c = m.category_name || m.category || 'Other'; catMap[c] = (catMap[c] || 0) + 1; });
        setDonutStock(Object.entries(catMap).map(([name, value]) => ({ name, value })));
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fallback demo area data if no real data
  const demoArea = [
    { month: 'Jan', requests: 12 },
    { month: 'Feb', requests: 28 },
    { month: 'Mar', requests: 18 },
    { month: 'Apr', requests: 35 },
    { month: 'May', requests: 42 },
    { month: 'Jun', requests: 30 },
    { month: 'Jul', requests: 55 },
    { month: 'Aug', requests: 48 },
    { month: 'Sep', requests: 62 },
  ];

  const demoPie = [
    { name: 'Pending', value: 45 },
    { name: 'Approved / Delivered', value: 30 },
    { name: 'Approved / Partially Delivered', value: 15 },
    { name: 'Rejected', value: 10 },
  ];

  const demoDonut = [
    { name: 'Steel', value: 40 },
    { name: 'Cement', value: 25 },
    { name: 'Electrical', value: 20 },
    { name: 'Plumbing', value: 15 },
  ];

  const finalArea = areaData.length > 0 ? areaData : demoArea;
  const finalPie = pieConsumption.length > 0 ? pieConsumption : demoPie;
  const finalDonut = donutStock.length > 0 ? donutStock : demoDonut;

  const colStyle = { padding: '10px 18px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' };
  const thStyle = { padding: '9px 18px', background: '#f8fafc', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '2px solid #e2e8f0' };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            {getGreeting()}, {user?.full_name || 'Admin'} 👋
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
            Here's what's happening in your store today.
          </p>
        </div>
        <div style={{
          background: '#fff', borderRadius: '8px', padding: '8px 16px',
          fontSize: '13px', fontWeight: '600', color: '#475569',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          📅 {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        <StatCard
          label="Total Material Request"
          value={kpi.totalMR}
          icon="📋"
          gradient="linear-gradient(135deg,#1e3a5f 0%,#2b6cb0 100%)"
          onClick={() => navigate('/material-requests')}
        />
        <StatCard
          label="Pending Approval"
          value={kpi.pendingApproval}
          icon="⏳"
          gradient="linear-gradient(135deg,#3d6b21 0%,#5a9a2f 100%)"
        />
        <StatCard
          label="Total Received"
          value={kpi.totalReceived}
          icon="✅"
          gradient="linear-gradient(135deg,#9b1c1c 0%,#e53e3e 100%)"
        />
        <StatCard
          label="Pending / Ready"
          value={kpi.pendingReady}
          icon="🚀"
          gradient="linear-gradient(135deg,#065f78 0%,#0ea5e9 100%)"
        />
      </div>

      {/* ── TABLES ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Recent Material Requests */}
        <Card title="📋 Recent Material Request" headerRight={
          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            onClick={() => navigate('/material-requests')}>View All</span>
        }>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Job / MR No.', 'Location', 'Required', 'Approval / Delivery Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMR.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...colStyle, textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No data available</td></tr>
                ) : recentMR.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{ ...colStyle, maxWidth: '30px', color: '#94a3b8', fontWeight: '700' }}>{row.sn}</td>
                    <td style={{ ...colStyle, fontWeight: '600', color: '#1e40af' }}>{row.jobNo}</td>
                    <td style={colStyle}>{row.location}</td>
                    <td style={{ ...colStyle, color: '#64748b' }}>{row.required}</td>
                    <td style={{ ...colStyle, maxWidth: '200px' }}><Badge label={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stock Inventory */}
        <Card title="📦 Stock Inventory" headerRight={
          <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            onClick={() => navigate('/main-store/materials')}>View All</span>
        }>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Code', 'Name', 'Brand', 'Current Stock'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockItems.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...colStyle, textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No stock data</td></tr>
                ) : stockItems.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{ ...colStyle, maxWidth: '30px', color: '#94a3b8', fontWeight: '700' }}>{row.sn}</td>
                    <td style={{ ...colStyle, fontWeight: '600', color: '#0369a1' }}>{row.code}</td>
                    <td style={{ ...colStyle, fontWeight: '500' }}>{row.name}</td>
                    <td style={{ ...colStyle, color: '#64748b' }}>{row.brand}</td>
                    <td style={{ ...colStyle }}>
                      <span style={{
                        fontWeight: '700',
                        color: Number(row.currentStock) > 50 ? '#15803d' : Number(row.currentStock) > 10 ? '#d97706' : '#dc2626'
                      }}>{row.currentStock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>

        {/* Area Chart — Consumption/MR Trend */}
        <Card title="📈 Material Request Trend">
          <div style={{ padding: '16px 8px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={finalArea} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  name="Requests"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#colorReq)"
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart — Material Consumption status */}
        <Card title="🥧 Consumption Breakdown">
          <div style={{ padding: '10px 8px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={finalPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  labelLine={false}
                >
                  {finalPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart — Stock by Category */}
        <Card title="🍩 Stock by Category">
          <div style={{ padding: '10px 8px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={finalDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={85}
                  dataKey="value"
                  labelLine={false}
                >
                  {finalDonut.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── QUICK ACTIONS FOOTER ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
        {[
          { icon: '📋', label: 'Material Requests', path: '/material-requests', color: '#3b82f6' },
          { icon: '📦', label: 'Store Materials', path: '/main-store/materials', color: '#10b981' },
          { icon: '🛒', label: 'Purchase Order', path: '/main-store/purchase-order', color: '#f59e0b' },
          { icon: '🔄', label: 'Purchase Return', path: '/main-store/return-order', color: '#ef4444' },
          { icon: '⚗️', label: 'Consumption', path: '/materials/consumption', color: '#8b5cf6' },
          { icon: '👥', label: 'User Master', path: '/users/master', color: '#0ea5e9' },
        ].map(a => (
          <button key={a.path}
            onClick={() => navigate(a.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#fff', border: `1.5px solid ${a.color}20`,
              borderRadius: '8px', padding: '10px 18px',
              fontSize: '13px', fontWeight: '600', color: a.color,
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = a.color; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = a.color; }}
          >
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
