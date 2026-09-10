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
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
          padding: '5px 12px 5px 6px', cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s'
        }}
      >
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#1e293b,#334155)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0
        }}>
          {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', lineHeight: '1.2' }}>
            {user?.full_name || user?.email || 'Admin'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.2' }}>
            {ROLE_LABELS[user?.role] || user?.role || 'Company Admin'}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: '#fff', borderRadius: '8px', minWidth: '180px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
          zIndex: 9999, overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              {user?.full_name || 'Admin'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {ROLE_LABELS[user?.role] || user?.role || 'Company Admin'}
            </div>
          </div>

          {[
            { icon: '👤', label: 'My Profile',         path: '/my-profile',       color: '#1e293b' },
            { icon: '🔑', label: 'Change Password',  path: '/change-password',  color: '#1e293b' },
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
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
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
              fontWeight: '600', color: '#ef4444', textAlign: 'left',
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
      '/projects': 'Projects',
      '/sites': 'Sites',
      '/boq': 'BOQ',
      '/materials/master': 'Material Master',
      '/materials/categories': 'Material Categories',
      '/materials/units': 'Units',
      '/materials/requests': 'Material Requests',
      '/materials/requests/new': 'New Material Request',
      '/approvals': 'Approval Center',
      '/procurement/orders': 'Purchase Orders',
      '/procurement/deliveries': 'Deliveries',
      '/procurement/grn': 'Goods Receipt Note (GRN)',
      '/vendors': 'Vendor Master',
      '/vendors/performance': 'Vendor Performance',
      '/inventory': 'Inventory Dashboard',
      '/inventory/stock': 'Stock',
      '/inventory/issue': 'Material Issue',
      '/inventory/transfer': 'Stock Transfer',
      '/inventory/adjustment': 'Stock Adjustment',
      '/inventory/ledger': 'Stock Ledger',
      '/hr/users': 'User Master',
      '/hr/employees': 'Employee Master',
      '/hr/attendance': 'Manual Attendance',
      '/hr/attendance/reports': 'Attendance Reports',
      '/reports': 'Reports & Analytics Hub',
      '/reports/purchase-register': 'Purchase Register',
      '/reports/audit-logs': 'Audit Trail & Activity Logs',
      '/purchase-register': 'Purchase Register',
      '/settings': 'Company Settings',
      '/settings/roles': 'Users & Roles',
      '/settings/workflows': 'Approval Workflow',
      '/settings/notifications': 'Notifications',
      '/settings/audit-logs': 'Audit Trail & Activity Logs',
      '/my-profile': 'My Profile',
      '/change-password': 'Change Password',
    };
    if (p.startsWith('/sites/')) return 'Site Details';
    return titles[p] || 'SiteTrack ERP';
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ backgroundColor: '#1e293b' }}>
        <div
          className="sidebar-logo"
          onClick={() => { navigate('/'); closeSidebar(); }}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon">🏗️</div>
          <div className="logo-text">
            <span className="logo-title">SiteTrack</span>
            <span className="logo-subtitle">Construction ERP</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <SideLink to="/" icon="📊" label="Dashboard" end onClick={closeSidebar} />

          <NavGroup label="PROJECT MANAGEMENT">
            <SideLink to="/projects" icon="📁" label="Projects" onClick={closeSidebar} />
            <SideLink to="/sites" icon="🏗️" label="Sites" onClick={closeSidebar} />
            <SideLink to="/boq" icon="📋" label="BOQ" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="MATERIALS">
            <SideLink to="/materials/master" icon="📦" label="Material Master" onClick={closeSidebar} />
            <SideLink to="/materials/categories" icon="🏷️" label="Material Categories" onClick={closeSidebar} />
            <SideLink to="/materials/units" icon="📏" label="Units" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="PROCUREMENT">
            <SideLink to="/materials/requests" icon="📤" label="Material Requests" onClick={closeSidebar} />
            <SideLink to="/approvals" icon="✅" label="Approval Center" onClick={closeSidebar} />
            <SideLink to="/procurement/orders" icon="🛒" label="Purchase Orders" onClick={closeSidebar} />
            <SideLink to="/procurement/deliveries" icon="🚛" label="Deliveries" onClick={closeSidebar} />
            <SideLink to="/procurement/grn" icon="📥" label="GRN" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="VENDORS">
            <SideLink to="/vendors" icon="🏢" label="Vendor Master" onClick={closeSidebar} />
            <SideLink to="/vendors/performance" icon="📊" label="Vendor Performance" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="INVENTORY">
            <SideLink to="/inventory" icon="📊" label="Inventory Dashboard" onClick={closeSidebar} />
            <SideLink to="/inventory/stock" icon="📦" label="Stock" onClick={closeSidebar} />
            <SideLink to="/inventory/issue" icon="📤" label="Material Issue" onClick={closeSidebar} />
            <SideLink to="/inventory/transfer" icon="🔄" label="Stock Transfer" onClick={closeSidebar} />
            <SideLink to="/inventory/adjustment" icon="⚖️" label="Stock Adjustment" onClick={closeSidebar} />
            <SideLink to="/inventory/ledger" icon="📒" label="Stock Ledger" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="HR & ATTENDANCE">
            <SideLink to="/hr/users" icon="👤" label="User Master" onClick={closeSidebar} />
            <SideLink to="/hr/employees" icon="👥" label="Employee Master" onClick={closeSidebar} />
            <SideLink to="/hr/attendance" icon="📋" label="Manual Attendance" onClick={closeSidebar} />
            <SideLink to="/hr/attendance/reports" icon="📊" label="Attendance Reports" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="REPORTS">
            <SideLink to="/reports" icon="📈" label="Reports & Analytics" end onClick={closeSidebar} />
            <SideLink to="/reports/purchase-register" icon="📑" label="Purchase Register" onClick={closeSidebar} />
            <SideLink to="/reports/audit-logs" icon="🛡️" label="Audit Trail" onClick={closeSidebar} />
          </NavGroup>

          <NavGroup label="SETTINGS">
            <SideLink to="/settings" icon="⚙️" label="Company Settings" onClick={closeSidebar} />
            <SideLink to="/settings/roles" icon="🔐" label="Users & Roles" onClick={closeSidebar} />
            <SideLink to="/settings/workflows" icon="🔄" label="Approval Workflow" onClick={closeSidebar} />
            <SideLink to="/settings/notifications" icon="🔔" label="Notifications" onClick={closeSidebar} />
            <SideLink to="/settings/audit-logs" icon="🛡️" label="System Audit Logs" onClick={closeSidebar} />
          </NavGroup>
        </div>

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

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
            <div className="topbar-search" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search everything..." 
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', borderRadius: '20px', 
                  border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                  fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="topbar-icon-btn" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
              🔔
              <span className="topbar-badge" style={{
                position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', 
                color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', 
                padding: '2px 5px'
              }}>3</span>
            </button>

            {user && (
              <UserDropdown user={user} onLogout={handleLogout} />
            )}
          </div>
        </div>

        <div className="main-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
