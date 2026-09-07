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
    <span className="link-icon-wrap">{icon}</span>
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
      '/materials/catalog': 'Material Master Catalog',
      '/materials/requests': 'Material Requests',
      '/materials/stock': 'Site Material Stock & Balance',
      '/procurement/requests': 'Purchase Requests',
      '/procurement/orders': 'Purchase Orders',
      '/billing/clients': 'Client Master',
      '/billing/invoices': 'Billing & Invoicing',
      '/equipment/master': 'Equipment Master Catalog',
      '/equipment/allocation': 'Site Equipment Allocation',
      '/equipment/movement': 'Equipment Site Transfer',
      '/equipment/daily-log': 'Daily Equipment Log',
      '/attendance/bulk': 'Daily Bulk Attendance',
      '/attendance/payroll': 'Payroll Summary',
      '/attendance/history': 'Attendance History',
      '/equipment/maintenance': 'Maintenance Work Orders',
      '/equipment/breakdown': 'Breakdown Log',
      '/equipment/documents': 'Documents & Compliance Vault',
      '/masters/employees': 'Employee Master',
      '/masters/operators': 'Equipment Operators Master',
      '/masters/vendors': 'Vendor & Supplier Directory',
      '/reports': 'Reports & Analytics',
      '/notifications': 'Notification Center',
      '/main-store/category': 'Manage Category',
      '/main-store/brand': 'Manage Brand',
      '/main-store/materials': 'Manage Material',
      '/main-store/purchase-order': 'Manage Purchase Order',
      '/main-store/return-order': 'Manage Return Order',
      '/my-profile': 'My Profile',
      '/change-password': 'Change Password',
      '/users/master': 'User Master',
    };
    return titles[p] || 'AK Construction ERP';
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">🏗️</div>
          <div className="logo-text">
            <span className="logo-title">AK Construction</span>
            <span className="logo-subtitle">Site Management ERP</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">

          <SideLink to="/" icon="📊" label="Dashboard" end onClick={closeSidebar} />

          <NavGroup label="🏭 MAIN STORE">
            <SideLink to="/main-store/category" icon="🏷️" label="Category" onClick={closeSidebar} />
            <SideLink to="/main-store/brand" icon="🏷️" label="Brand" onClick={closeSidebar} />
            <SideLink to="/main-store/materials" icon="📦" label="Materials" onClick={closeSidebar} />
            <SideLink to="/main-store/purchase-order" icon="🛒" label="Purchase Order" onClick={closeSidebar} />
            <SideLink to="/main-store/return-order" icon="🔄" label="Return Order" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="📋 PROJECT">
            <SideLink to="/project/work-packages" icon="📋" label="Work Packages" onClick={closeSidebar} />
            <SideLink to="/masters/projects" icon="🏗️" label="Project Master" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="📦 MATERIALS">
            <SideLink to="/materials/catalog" icon="📦" label="Material Catalog" onClick={closeSidebar} />
            <SideLink to="/materials/requests" icon="📤" label="Material Requests" onClick={closeSidebar} />
            <SideLink to="/materials/consumption" icon="📉" label="Consumption" onClick={closeSidebar} />
            <SideLink to="/materials/consumption-report" icon="📊" label="Consumption Report" onClick={closeSidebar} />
            <SideLink to="/materials/stock" icon="📊" label="Site Stock" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="👷 WORKFORCE">
            <SideLink to="/attendance/bulk" icon="📋" label="Bulk Attendance" onClick={closeSidebar} />
            <SideLink to="/attendance/history" icon="📅" label="Attendance History" onClick={closeSidebar} />
            <SideLink to="/attendance/payroll" icon="💵" label="Payroll Summary" onClick={closeSidebar} />
            <SideLink to="/masters/employees" icon="👥" label="Employee Master" onClick={closeSidebar} />
            <SideLink to="/masters/operators" icon="🦺" label="Operators Master" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="🛒 PROCUREMENT">
            <SideLink to="/procurement/requests" icon="📋" label="Purchase Requests" onClick={closeSidebar} />
            <SideLink to="/procurement/orders" icon="🛒" label="Purchase Orders" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="💰 BILLING & INVOICING">
            <SideLink to="/billing/clients" icon="🏢" label="Client Master" onClick={closeSidebar} />
            <SideLink to="/billing/invoices" icon="📄" label="Invoices & Payments" onClick={closeSidebar} />
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

          <NavGroup label="👥 USERS">
            <SideLink to="/users/master" icon="👥" label="Users" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="👤 MY ACCOUNT">
            <SideLink to="/my-profile" icon="🙋" label="My Profile" onClick={closeSidebar} />
            <SideLink to="/change-password" icon="🔑" label="Change Password" onClick={closeSidebar} />
          </NavGroup>

        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <LanguageSwitcher variant="sidebar" />
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.full_name || user.email || user.mobile}</div>
                <div className="sidebar-user-role">{ROLE_LABELS[user.role] || user.role}</div>
              </div>
            </div>
          )}
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(239,68,68,0.3)', width: '100%', marginTop: '2px', borderRadius: '10px' }}
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
