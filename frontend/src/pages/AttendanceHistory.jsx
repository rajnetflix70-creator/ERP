import React, { useState, useEffect } from 'react';
import { getAttendanceHistory } from '../api/attendance';
import apiClient from '../api/client';
import { useTranslation } from 'react-i18next';

const AttendanceHistory = () => {
  const { t } = useTranslation();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch employees for dropdown
    apiClient.get('/employees').then(r => {
      const raw = r.data?.data?.data || r.data?.data || r.data || [];
      if (Array.isArray(raw)) {
        setUsers(raw.map(u => ({ id: u.id, full_name: u.full_name || u.name, employee_id: u.employee_id || u.code })));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      getAttendanceHistory(selectedUserId, month)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setHistory([]);
    }
  }, [selectedUserId, month]);

  // Generate calendar days
  const year = parseInt(month.split('-')[0]);
  const monthNum = parseInt(month.split('-')[1]) - 1;
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  const firstDay = new Date(year, monthNum, 1).getDay(); // 0 = Sunday

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getStatusForDay = (day) => {
    if (!day) return null;
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    return history.find(h => h.attendance_date.startsWith(dateStr));
  };

  const statusColors = {
    present: 'var(--color-success)',
    absent: 'var(--color-danger)',
    half_day: 'var(--color-warning)',
    on_leave: 'var(--color-secondary)'
  };

  return (
    <div style={{ padding: '0 20px', maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">📅 Attendance History</h1>
          <p className="page-subtitle">View monthly attendance calendar for any employee.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Select Employee</label>
            <select className="form-control" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
              <option value="">-- Choose Employee --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role_id === 1 ? 'Admin' : 'Employee'})</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Month</label>
            <input
              type="month"
              className="form-control"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}

      {!loading && selectedUserId && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontWeight: 'bold', padding: 10, background: 'var(--color-surface)' }}>{d}</div>
            ))}
            {days.map((day, idx) => {
              const record = getStatusForDay(day);
              return (
                <div key={idx} style={{ 
                  border: '1px solid var(--color-border)', 
                  padding: 10, 
                  minHeight: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  background: record ? 'var(--color-surface)' : 'transparent'
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-header)', marginBottom: 8 }}>{day || ''}</div>
                  {record && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      background: statusColors[record.status] || '#ccc',
                      color: '#fff',
                      padding: '4px',
                      borderRadius: 4,
                      marginTop: 'auto',
                      fontWeight: 700
                    }}>
                      {record.status.replace('_', ' ').toUpperCase()}
                      {record.overtime_hours > 0 && <div style={{ marginTop: 4 }}>OT: {record.overtime_hours}h</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
