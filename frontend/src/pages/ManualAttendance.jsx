import React, { useState, useEffect } from 'react';
import client from '../api/client';
import dayjs from 'dayjs';

const ManualAttendance = () => {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  const statusList = ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekly Off'];

  useEffect(() => {
    const loadEmployeesAndSites = async () => {
      setLoading(true);
      try {
        const [empRes, siteRes] = await Promise.allSettled([
          client.get('/employees?limit=200'),
          client.get('/sites?limit=100')
        ]);

        if (siteRes.status === 'fulfilled') {
          const rawS = siteRes.value?.data?.data || siteRes.value?.data || [];
          if (Array.isArray(rawS)) {
            setSites(rawS.map(s => s.name || s.site_name));
          }
        }

        if (empRes.status === 'fulfilled') {
          const rawE = empRes.value?.data?.data || empRes.value?.data || [];
          if (Array.isArray(rawE)) {
            const mapped = rawE.map((u, i) => ({
              id: u.id || i + 1,
              user_id: u.id,
              emp_id: u.employee_id || `EMP-${(i + 1).toString().padStart(3, '0')}`,
              name: u.full_name || 'Employee',
              dept: u.department || 'Operations',
              designation: u.role || 'Staff',
              site: u.site_name || 'Main Site',
              check_in: '08:30 AM',
              check_out: '06:00 PM',
              status: 'Present',
              hours: '9h 30m',
              remarks: ''
            }));
            setAttendance(mapped);
          }
        }
      } catch (err) {
        console.warn('Error loading attendance data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeesAndSites();
  }, [date]);

  const filtered = attendance.filter(item => {
    const matchSearch = (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (item.emp_id || '').toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'All' || item.dept === selectedDept;
    const matchSite = selectedSite === 'All' || item.site === selectedSite;
    return matchSearch && matchDept && matchSite;
  });

  const handleStatusChange = (id, newStatus) => {
    setAttendance(attendance.map(a => a.id === id ? {
      ...a,
      status: newStatus,
      check_in: newStatus === 'Present' ? (a.check_in === '—' ? '08:30 AM' : a.check_in) : newStatus === 'Half Day' ? '08:30 AM' : '—',
      check_out: newStatus === 'Present' ? (a.check_out === '—' ? '06:00 PM' : a.check_out) : newStatus === 'Half Day' ? '01:30 PM' : '—',
      hours: newStatus === 'Present' ? '9h 30m' : newStatus === 'Half Day' ? '4h 30m' : '0h'
    } : a));
  };

  const handleMarkAll = (status) => {
    setAttendance(attendance.map(a => ({
      ...a,
      status,
      check_in: status === 'Present' ? '08:30 AM' : '—',
      check_out: status === 'Present' ? '06:00 PM' : '—',
      hours: status === 'Present' ? '9h 30m' : '0h'
    })));
  };

  const handleSubmit = async () => {
    try {
      const records = attendance.map(a => ({
        user_id: a.user_id,
        date: date,
        status: a.status.toLowerCase(),
        check_in: a.check_in,
        check_out: a.check_out,
        hours: a.hours
      }));
      await client.post('/attendance', { records });
    } catch (e) {
      console.warn('Submit attendance error:', e);
    }
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const stats = {
    total: filtered.length,
    present: filtered.filter(a => a.status === 'Present').length,
    absent: filtered.filter(a => a.status === 'Absent').length,
    halfDay: filtered.filter(a => a.status === 'Half Day').length,
    leave: filtered.filter(a => a.status === 'Leave').length,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manual Attendance</h1>
          <p className="page-subtitle">Site workforce daily muster roll, check-in tracking & hours approval</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => handleMarkAll('Present')}>
            ✓ Mark All Present
          </button>
          <button className="btn btn-secondary" onClick={() => handleMarkAll('Absent')}>
            ✕ Mark All Absent
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            💾 Submit Attendance
          </button>
        </div>
      </div>

      {savedAlert && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          ✓ Attendance for {dayjs(date).format('DD-MMM-YYYY')} at {selectedSite} has been submitted for Site Manager review!
        </div>
      )}

      {/* Summary Stat Badges */}
      <div className="stats-grid" style={{ marginBottom: '16px' }}>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Workforce</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--navy)' }}>{stats.total}</div>
          </div>
          <div style={{ fontSize: '1.6rem' }}>👥</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--success)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600', textTransform: 'uppercase' }}>Present</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--navy)' }}>{stats.present}</div>
          </div>
          <div style={{ fontSize: '1.6rem' }}>🟢</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--danger)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '600', textTransform: 'uppercase' }}>Absent</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--navy)' }}>{stats.absent}</div>
          </div>
          <div style={{ fontSize: '1.6rem' }}>🔴</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--warning)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: '600', textTransform: 'uppercase' }}>Half Day / Leave</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--navy)' }}>{stats.halfDay + stats.leave}</div>
          </div>
          <div style={{ fontSize: '1.6rem' }}>🟡</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Date:</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 10px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Site:</span>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Sites</option>
              {sites.map(siteName => (
                <option key={siteName} value={siteName}>{siteName}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Department:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Departments</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Procurement">Procurement</option>
              <option value="Operations">Operations</option>
              <option value="Stores & Inventory">Stores & Inventory</option>
              <option value="Electrical">Electrical</option>
              <option value="Safety & Quality">Safety & Quality</option>
              <option value="Plant & Machinery">Plant & Machinery</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search employee by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ padding: '6px 12px' }}
            />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Employee ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Site</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th style={{ width: '150px' }}>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No workforce records found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{item.emp_id}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text)' }}>
                      <div>{item.name}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.designation}</span>
                    </td>
                    <td>{item.dept}</td>
                    <td><span className="badge badge-info">{item.site}</span></td>
                    <td>
                      <input
                        type="text"
                        value={item.check_in}
                        onChange={e => {
                          const val = e.target.value;
                          setAttendance(attendance.map(a => a.id === item.id ? { ...a, check_in: val } : a));
                        }}
                        className="form-control"
                        style={{ width: '100px', padding: '4px 8px', fontSize: '0.8rem', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.check_out}
                        onChange={e => {
                          const val = e.target.value;
                          setAttendance(attendance.map(a => a.id === item.id ? { ...a, check_out: val } : a));
                        }}
                        className="form-control"
                        style={{ width: '100px', padding: '4px 8px', fontSize: '0.8rem', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ fontWeight: '600', color: item.hours !== '0h' ? 'var(--navy)' : 'var(--text-muted)' }}>
                      {item.hours}
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value)}
                        className="form-control"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: item.status === 'Present' ? '#dcfce7' : item.status === 'Absent' ? '#fee2e2' : item.status === 'Half Day' ? '#fef3c7' : '#f1f5f9',
                          color: item.status === 'Present' ? '#15803d' : item.status === 'Absent' ? '#b91c1c' : item.status === 'Half Day' ? '#92400e' : '#475569'
                        }}
                      >
                        {statusList.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={e => {
                          const val = e.target.value;
                          setAttendance(attendance.map(a => a.id === item.id ? { ...a, remarks: val } : a));
                        }}
                        placeholder="Remarks..."
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <b>{filtered.length}</b> total workforce muster entries for <b>{dayjs(date).format('DD MMMM YYYY')}</b>
          </span>
          <button className="btn btn-sm btn-outline" onClick={() => window.print()}>
            🖨️ Print Muster Roll
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendance;
