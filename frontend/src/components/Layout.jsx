import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import RoleGuard from './RoleGuard';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
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

/* ── WEBREXLAB Diamond SVG Logo ── */
const DiamondLogo = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="19,2 36,19 19,36 2,19" fill="#1a2a4a" stroke="#f0a500" strokeWidth="2"/>
    <polygon points="19,8 30,19 19,30 8,19" fill="#f0a500" opacity="0.85"/>
    <polygon points="19,13 25,19 19,25 13,19" fill="#fff" opacity="0.95"/>
  </svg>
);

/* ── User Dropdown ── */
const UserDropdown = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
          padding: '5px 12px 5px 6px', cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s'
        }}
      >
        {/* Avatar circle */}
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#2b5876,#4e8098)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0
        }}>
          {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>
          {user?.full_name || user?.email || 'Admin'}
        </span>
        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '2px' }}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: '#fff', borderRadius: '8px', minWidth: '180px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
          zIndex: 9999, overflow: 'hidden'
        }}>
          {/* User info header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              {user?.full_name || 'Admin'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {ROLE_LABELS[user?.role] || user?.role || 'Company Admin'}
            </div>
          </div>

          {/* Menu Items */}
          {[
            { icon: '👤', label: 'Profile',         path: '/my-profile',       color: '#1d4ed8' },
            { icon: '🔑', label: 'Change Password',  path: '/change-password',  color: '#1d4ed8' },
          ].map(item => (
            <button key={item.path}
              onClick={() => go(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 16px', background: 'transparent',
                border: 'none', cursor: 'pointer', fontSize: '13px',
                fontWeight: '600', color: item.color, textAlign: 'left',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}

          <div style={{ borderTop: '1px solid #f1f5f9' }} />

          <button
            onClick={() => { setOpen(false); onLogout(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 16px', background: 'transparent',
              border: 'none', cursor: 'pointer', fontSize: '13px',
              fontWeight: '600', color: '#dc2626', textAlign: 'left',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      )}
    </div>
  );
};

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
    return titles[p] || 'WEBREXLAB ERP';
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* ── WEBREXLAB Logo — clicks to Dashboard ── */}
        <div
          className="sidebar-logo"
          onClick={() => { navigate('/'); closeSidebar(); }}
          style={{ cursor: 'pointer' }}
        >
          <DiamondLogo />
          <div className="logo-text">
            <span className="logo-title" style={{ fontWeight: '800', letterSpacing: '1px', fontSize: '15px' }}>
              WEBREXLAB
            </span>
            <span className="logo-subtitle" style={{ fontSize: '10px', color: '#f0a500', fontWeight: '600', letterSpacing: '0.5px' }}>
              Software Company
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">

          <SideLink to="/" icon="📊" label="Dashboard" end onClick={closeSidebar} />

          <NavGroup label="🏭 MAIN STORE">
            <SideLink to="/main-store/category"     icon="🏷️" label="Category"       onClick={closeSidebar} />
            <SideLink to="/main-store/brand"         icon="🏷️" label="Brand"          onClick={closeSidebar} />
            <SideLink to="/main-store/materials"     icon="📦" label="Materials"       onClick={closeSidebar} />
            <SideLink to="/main-store/purchase-order" icon="🛒" label="Purchase Order" onClick={closeSidebar} />
            <SideLink to="/main-store/return-order"  icon="🔄" label="Return Order"    onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="📋 PROJECT">
            <SideLink to="/project/work-packages" icon="📋" label="Work Packages"  onClick={closeSidebar} />
            <SideLink to="/masters/projects"      icon="🏗️" label="Project Master" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="📦 MATERIALS">
            <SideLink to="/materials/catalog"           icon="📦" label="Material Catalog"   onClick={closeSidebar} />
            <SideLink to="/materials/requests"          icon="📤" label="Material Requests"   onClick={closeSidebar} />
            <SideLink to="/materials/consumption"       icon="📉" label="Consumption"         onClick={closeSidebar} />
            <SideLink to="/materials/consumption-report" icon="📊" label="Consumption Report" onClick={closeSidebar} />
            <SideLink to="/materials/stock"             icon="📊" label="Site Stock"          onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="👷 WORKFORCE">
            <SideLink to="/attendance/bulk"    icon="📋" label="Bulk Attendance"   onClick={closeSidebar} />
            <SideLink to="/attendance/history" icon="📅" label="Attendance History" onClick={closeSidebar} />
            <SideLink to="/attendance/payroll" icon="💵" label="Payroll Summary"   onClick={closeSidebar} />
            <SideLink to="/masters/employees"  icon="👥" label="Employee Master"   onClick={closeSidebar} />
            <SideLink to="/masters/operators"  icon="🦺" label="Operators Master"  onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="🛒 PROCUREMENT">
            <SideLink to="/procurement/requests" icon="📋" label="Purchase Requests" onClick={closeSidebar} />
            <SideLink to="/procurement/orders"   icon="🛒" label="Purchase Orders"   onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="💰 BILLING & INVOICING">
            <SideLink to="/billing/clients"  icon="🏢" label="Client Master"       onClick={closeSidebar} />
            <SideLink to="/billing/invoices" icon="📄" label="Invoices & Payments"  onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="🔧 EQUIPMENT">
            <SideLink to="/equipment/master"       icon="⚙️" label="Equipment Master" onClick={closeSidebar} />
            <SideLink to="/equipment/allocation"   icon="📍" label="Site Allocation"  onClick={closeSidebar} />
            <SideLink to="/equipment/movement"     icon="🚛" label="Movement Log"     onClick={closeSidebar} />
            <SideLink to="/equipment/daily-log"    icon="📅" label="Daily Log"        onClick={closeSidebar} />
            <SideLink to="/equipment/maintenance"  icon="🔧" label="Maintenance"      onClick={closeSidebar} />
            <SideLink to="/equipment/breakdown"    icon="⚠️" label="Breakdowns"       onClick={closeSidebar} />
            <SideLink to="/equipment/documents"    icon="📁" label="Documents Vault"  onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="🏢 MASTERS">
            <SideLink to="/masters/vendors" icon="🏢" label="Vendors" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="📊 REPORTS">
            <SideLink to="/reports"       icon="📈" label="Reports & Analytics" onClick={closeSidebar} />
            <SideLink to="/notifications" icon="🔔" label="Notifications"       onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="👥 USERS">
            <SideLink to="/users/master" icon="👥" label="Users" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="👤 MY ACCOUNT">
            <SideLink to="/my-profile"      icon="🙋" label="My Profile"       onClick={closeSidebar} />
            <SideLink to="/change-password" icon="🔑" label="Change Password"  onClick={closeSidebar} />
          </NavGroup>

        </div>

        {/* Footer — user info only, NO logout button */}
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
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <span className="topbar-title">{getPageTitle()}</span>
          </div>

          {/* ── Top-right User Dropdown ── */}
          {user && (
            <UserDropdown user={user} onLogout={handleLogout} />
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
