import React, { useState } from 'react';

const INITIAL_CHANNELS = [
  { id: 'mr_approval', label: 'Material Request Approval Triggers', email: true, sms: true, inapp: true },
  { id: 'po_approval', label: 'Purchase Order Approval & Dispatch', email: true, sms: false, inapp: true },
  { id: 'grn_delivery', label: 'Site GRN Delivery Inward Slips', email: false, sms: true, inapp: true },
  { id: 'low_stock', label: 'Low Stock & Minimum Inventory Threshold Alerts', email: true, sms: true, inapp: true },
  { id: 'attendance_muster', label: 'Daily Attendance Submission & Approval', email: true, sms: false, inapp: true },
  { id: 'equipment_breakdown', label: 'Equipment Breakdown & Safety Alerts', email: true, sms: true, inapp: true }
];

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [notifications, setNotifications] = useState([]);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [saved, setSaved] = useState(false);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleToggleChannel = (id, field) => {
    setChannels(channels.map(c => c.id === id ? { ...c, [field]: !c[field] } : c));
  };

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Center & Alerts</h1>
          <p className="page-subtitle">Real-time system events, material alerts, approval requests & delivery updates</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'feed' && unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllAsRead}>
              ✓ Mark All as Read
            </button>
          )}
          {activeTab === 'rules' && (
            <button className="btn btn-primary" onClick={handleSavePreferences}>
              💾 Save Notification Rules
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          ✓ Notification channel preferences and escalation rules updated successfully!
        </div>
      )}

      {/* Tab Switcher */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          🔔 Live Notification Feed ({unreadCount} Unread)
        </button>
        <button
          className={`tab-item ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ⚙️ Notification Channel Preferences
        </button>
      </div>

      {/* Live Feed Tab */}
      {activeTab === 'feed' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--navy)' }}>
              Recent Actionable Alerts & Events ({notifications.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Auto-refreshed live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</div>
                <div style={{ fontWeight: 600, color: '#475569' }}>No Unread Notifications</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>All caught up! System alerts and approval triggers will appear here.</div>
              </div>
            ) : (
              notifications.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px 20px',
                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    background: item.unread ? 'var(--primary-50)' : '#fff',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px',
                    background: item.type === 'alert' ? 'var(--danger-lt)' : item.type === 'approval' ? 'var(--info-lt)' : item.type === 'po' ? 'var(--warning-lt)' : 'var(--success-lt)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                  }}>
                    {item.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--navy)' }}>
                        {item.title}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.time}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a
                        href={item.link}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '3px 10px', fontSize: '0.75rem', textDecoration: 'none' }}
                      >
                        View Details →
                      </a>
                      {item.unread && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notification Rules Tab */}
      {activeTab === 'rules' && (
        <div className="card" style={{ maxWidth: '900px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--navy)', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            Notification Dispatch Channels
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Choose how site engineers, project managers, and store keepers receive real-time updates.
          </p>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Event Trigger</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>📧 Email Alert</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>📱 SMS Alert</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>💻 In-App Notification</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600', color: 'var(--text)' }}>
                      {c.label}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={c.email}
                        onChange={() => handleToggleChannel(c.id, 'email')}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={c.sms}
                        onChange={() => handleToggleChannel(c.id, 'sms')}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={c.inapp}
                        onChange={() => handleToggleChannel(c.id, 'inapp')}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-primary" onClick={handleSavePreferences}>
              💾 Save Channel Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
