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

const NavGroup = ({ label, children }) => (
  <div className="sidebar-group">
    <div className="sidebar-group-label">{label}</div>
    {children}
  </div>
);

const SideLink = ({ to, icon, label, end = false, onClick }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClick}>
    <span className="link-icon">{icon}</span>
    {label}
  </NavLink>
);

const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeSidebar = () => setSidebarOpen(false);

  const getPageTitle = () => {
    const p = location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/project/work-packages': 'Project Work Packages — Kanban',
      '/masters/projects': 'Site & Project Master',
      '/equipment/master': 'Equipment Master Catalog',
      '/equipment/allocation': 'Site Equipment Allocation',
      '/equipment/movement': 'Equipment Site Transfer',
      '/equipment/daily-log': 'Daily Equipment Log',
      '/attendance/bulk': 'Bulk Attendance Sheet',
      '/equipment/maintenance': 'Maintenance Work Orders',
      '/equipment/breakdown': 'Breakdown Log',
      '/equipment/documents': 'Documents & Compliance Vault',
      '/masters/employees': 'Employee & Staff Master',
      '/masters/operators': 'Equipment Operators Master',
      '/masters/vendors': 'Vendor & Supplier Directory',
      '/reports': 'Reports & Analytics',
      '/notifications': 'Notification Center',
    };
    return titles[p] || 'AK Construction ERP';
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem 1.5rem', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', fontWeight: '700' }}>
            🏗️ <span>AK Construction</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Site Management ERP
          </span>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">

          <SideLink to="/" icon="📊" label="Dashboard" end onClick={closeSidebar} />

          <NavGroup label="📋 PROJECT">
            <SideLink to="/project/work-packages" icon="📋" label="Work Packages" onClick={closeSidebar} />
            <SideLink to="/masters/projects" icon="🏗️" label="Project Master" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="👷 WORKFORCE">
            <SideLink to="/attendance/bulk" icon="📋" label="Bulk Attendance" onClick={closeSidebar} />
            <SideLink to="/masters/employees" icon="👥" label="Employee Master" onClick={closeSidebar} />
            <SideLink to="/masters/operators" icon="🦺" label="Operators Master" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="🔧 EQUIPMENT">
            <SideLink to="/equipment/master" icon="⚙️" label="Equipment Master" onClick={closeSidebar} />
            <SideLink to="/equipment/allocation" icon="📍" label="Site Allocation" onClick={closeSidebar} />
            <SideLink to="/equipment/movement" icon="🚛" label="Movement Log" onClick={closeSidebar} />
            <SideLink to="/equipment/daily-log" icon="📅" label="Daily Log" onClick={closeSidebar} />
            <SideLink to="/equipment/maintenance" icon="🔧" label="Maintenance" onClick={closeSidebar} />
            <SideLink to="/equipment/breakdown" icon="⚠️" label="Breakdowns" onClick={closeSidebar} />
            <SideLink to="/equipment/documents" icon="📁" label="Documents Vault" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="🏢 MASTERS">
            <SideLink to="/masters/vendors" icon="🏢" label="Vendors" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="📊 REPORTS">
            <SideLink to="/reports" icon="📈" label="Reports & Analytics" onClick={closeSidebar} />
            <SideLink to="/notifications" icon="🔔" label="Notifications" onClick={closeSidebar} />
          </NavGroup>

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
