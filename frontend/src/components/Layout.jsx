import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import RoleGuard from './RoleGuard';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  company_admin: 'Admin',
  project_manager: 'Project Manager',
  equipment_manager: 'Equipment Manager',
  site_supervisor: 'Supervisor',
  worker: 'Worker',
};

const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/') return 'Equipment ERP Dashboard';
    if (p === '/equipment/master') return 'Equipment Master Catalog';
    if (p === '/equipment/allocation') return 'Site Equipment Allocation';
    if (p === '/equipment/movement') return 'Equipment Site Transfer';
    if (p === '/equipment/daily-log') return 'Daily Usage & PDF Matrix Log';
    if (p === '/attendance/bulk') return 'Bulk Attendance Sheet';
    if (p === '/equipment/maintenance') return 'Maintenance Work Orders';
    if (p === '/equipment/breakdown') return 'Emergency Breakdown Log';
    if (p === '/equipment/documents') return 'Document & Compliance Vault';
    if (p === '/masters/employees') return 'Employee & Staff Master Directory';
    if (p === '/masters/operators') return 'Equipment Operators Master';
    if (p === '/masters/projects') return 'Site & Project Master (AK-Jobs)';
    if (p === '/masters/vendors') return 'Vendor & Service Directory';
    if (p === '/reports') return 'ERP Reports & Analytics';
    if (p === '/notifications') return 'Notification Alert Center';
    return 'AK Construction ERP';
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem 1.5rem', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', fontWeight: '700' }}>
            🏗️ <span>AK Construction</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Equipment Management ERP
          </span>
        </div>

        {/* Main Nav (15 Sections) */}
        <div className="sidebar-section">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">📊</span>
            Dashboard
          </NavLink>

          <NavLink to="/equipment/master" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">⚙️</span>
            Equipment Master
          </NavLink>

          <NavLink to="/equipment/allocation" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">📍</span>
            Site Allocation
          </NavLink>

          <NavLink to="/equipment/movement" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">🚛</span>
            Equipment Movement
          </NavLink>

          <NavLink to="/equipment/daily-log" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">📅</span>
            Daily Equipment Log
          </NavLink>

          <NavLink to="/attendance/bulk" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">📋</span>
            Bulk Attendance Sheet
          </NavLink>

          <NavLink to="/equipment/maintenance" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">🔧</span>
            Maintenance
          </NavLink>

          <NavLink to="/equipment/breakdown" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">⚠️</span>
            Breakdown Log
          </NavLink>

          <NavLink to="/equipment/documents" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">📁</span>
            Documents Vault
          </NavLink>

          <NavLink to="/masters/employees" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">👥</span>
            Employee Master
          </NavLink>

          <NavLink to="/masters/operators" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">👷</span>
            Operators Master
          </NavLink>

          <NavLink to="/masters/projects" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">🏗️</span>
            Sites / Projects
          </NavLink>

          <NavLink to="/masters/vendors" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">🏢</span>
            Vendors Directory
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">📈</span>
            Reports & Analytics
          </NavLink>

          <NavLink to="/notifications" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
            <span className="link-icon">🔔</span>
            Notification Center
          </NavLink>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <LanguageSwitcher variant="sidebar" />
          {user && (
            <div className="sidebar-user">
              <span className="sidebar-user-name">{user.full_name || user.email || user.mobile}</span>
              <span className="sidebar-user-role">{ROLE_LABELS[user.role] || user.role}</span>
            </div>
          )}
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.2)', width: '100%', marginTop: '0.5rem' }}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <span className="topbar-title">{getPageTitle()}</span>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                👤 {user.full_name || user.email}
              </span>
            </div>
          )}
        </div>

        <div className="main-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
