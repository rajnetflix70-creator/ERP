import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjectStats } from '../api/projects';
import './Dashboard.css';

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

  const kpiCards = [
    {
      number: stats?.total || 0,
      label: 'Total Projects',
      icon: '🏗️',
      accent: '#3b82f6',
      accentLt: '#eff6ff',
      onClick: () => navigate('/masters/projects'),
    },
    {
      number: stats?.active || 0,
      label: 'Active Projects',
      icon: '✅',
      accent: '#10b981',
      accentLt: '#ecfdf5',
      onClick: null,
    },
    {
      number: stats?.needs_supervisor || 0,
      label: 'Need Supervisor',
      icon: '⚠️',
      accent: '#f59e0b',
      accentLt: '#fffbeb',
      onClick: null,
    },
    {
      number: stats?.total_area ? Number(stats.total_area).toLocaleString() : '0',
      label: 'Total Area (sqft)',
      icon: '📐',
      accent: '#8b5cf6',
      accentLt: '#f5f3ff',
      onClick: null,
    },
  ];

  const statusItems = [
    { label: 'Active',            value: stats?.active || 0,            color: '#10b981' },
    { label: 'Grouting Pending',  value: stats?.grouting_pending || 0,  color: '#f59e0b' },
    { label: 'Completed',         value: stats?.completed || 0,          color: '#3b82f6' },
    { label: 'Stopped',           value: stats?.stopped || 0,            color: '#ef4444' },
    { label: 'Strengthening',     value: stats?.strengthening || 0,      color: '#8b5cf6' },
  ];

  const quickActions = [
    { icon: '📋', label: 'View Work List',      path: '/work-list' },
    { icon: '🚚', label: 'Equipment Tracking',  path: '/equipment/tracking' },
    { icon: '🏗️', label: 'Project Master',      path: '/masters/projects' },
    { icon: '👤', label: 'Employee Master',     path: '/masters/employees' },
    { icon: '⚙️', label: 'Equipment Master',    path: '/masters/equipment' },
  ];

  return (
    <div className="dashboard-wrapper">

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>{getGreeting()}, {user?.full_name}</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <div className="dashboard-date">
          {new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'long', timeStyle: 'short' })} (UAE Time)
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">{t('common.loading')}</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="kpi-card"
                style={{ '--kpi-accent': card.accent, '--kpi-accent-lt': card.accentLt, cursor: card.onClick ? 'pointer' : 'default' }}
                onClick={card.onClick || undefined}
              >
                <div className="kpi-icon">{card.icon}</div>
                <div className="kpi-number">{card.number}</div>
                <div className="kpi-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="dashboard-bottom-grid">

            {/* Project Status Overview */}
            <div className="status-overview-card">
              <div className="status-card-header">
                <h3>Project Status Overview</h3>
              </div>
              <div className="status-list">
                {statusItems.map((item) => (
                  <div key={item.label} className="status-row">
                    <div className="status-row-left">
                      <span className="status-dot" style={{ background: item.color }} />
                      {item.label}
                    </div>
                    <span className="status-count">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-card">
              <div className="quick-actions-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions-list">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="quick-action-btn"
                    onClick={() => navigate(action.path)}
                  >
                    <span className="qa-icon">{action.icon}</span>
                    <span className="qa-label">{action.label}</span>
                    <span className="qa-arrow">›</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
