import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/equipment-machines/notifications');
      setNotifications(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.patch(`/equipment-machines/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading notification alerts...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
        🔔 Notification & Compliance Center
      </h2>

      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
          System Alerts & Actionable Notifications ({notifications.length})
        </h3>

        {notifications.length === 0 ? (
          <p style={{ color: '#64748b' }}>No unread notifications.</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: n.is_read ? '#f8fafc' : '#eff6ff',
              border: `1px solid ${n.is_read ? '#e2e8f0' : '#bfdbfe'}`,
              marginBottom: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{n.title}</strong>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.3rem 0 0 0' }}>{n.message}</p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem', display: 'inline-block' }}>
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Mark Read ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
