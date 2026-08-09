import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjectStats } from '../api/projects';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProjectStats();
        setStats(data);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{getGreeting()}, {user?.full_name}</h1>
        <p className="page-subtitle">{new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} (UAE Time)</p>
      </div>

      {loading ? (
        <div className="text-center py-4">{t('common.loading')}</div>
      ) : (
        <>
          <div className="grid-4 mb-4">
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/work-list')}>
              <div className="stat-number">{stats?.total || 0}</div>
              <div className="stat-label">Total Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--color-success)' }}>{stats?.active || 0}</div>
              <div className="stat-label">Active Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--color-warning)' }}>{stats?.needs_supervisor || 0}</div>
              <div className="stat-label">Need Supervisor</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--color-info, #6ea8fe)' }}>
                {stats?.total_area ? Number(stats.total_area).toLocaleString() : '0'}
              </div>
              <div className="stat-label">Total Area (sqft)</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Project Status Overview</h3>
              </div>
              <div style={{ padding: '16px' }}>
                {[
                  { label: 'Active', value: stats?.active || 0, color: '#2ecc71' },
                  { label: 'Grouting Pending', value: stats?.grouting_pending || 0, color: '#f39c12' },
                  { label: 'Completed', value: stats?.completed || 0, color: '#3498db' },
                  { label: 'Stopped', value: stats?.stopped || 0, color: '#e74c3c' },
                  { label: 'Strengthening', value: stats?.strengthening || 0, color: '#9b59b6' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                      <span>{item.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => navigate('/work-list')}>
                  📋 View Work List
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/equipment/tracking')}>
                  🚚 Equipment Tracking
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/masters/projects')}>
                  🏗 Project Master
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/masters/employees')}>
                  👤 Employee Master
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/masters/equipment')}>
                  ⚙️ Equipment Master
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
