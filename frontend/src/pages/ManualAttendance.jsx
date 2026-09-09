import React, { useState } from 'react';
import dayjs from 'dayjs';

const INITIAL_ATTENDANCE = [
  { id: 1, emp_id: 'EMP-001', name: 'Suresh Babu', dept: 'Procurement', designation: 'Purchase Manager', site: 'Tower A', check_in: '08:45 AM', check_out: '06:15 PM', status: 'Present', hours: '9h 30m', remarks: 'On site verification' },
  { id: 2, emp_id: 'EMP-002', name: 'Ramesh Kumar', dept: 'Civil Engineering', designation: 'Site Engineer', site: 'Tower A', check_in: '08:30 AM', check_out: '06:00 PM', status: 'Present', hours: '9h 30m', remarks: 'Tower A casting' },
  { id: 3, emp_id: 'EMP-003', name: 'M. Natarajan', dept: 'Operations', designation: 'Crane Operator', site: 'Tower A', check_in: '08:15 AM', check_out: '05:45 PM', status: 'Present', hours: '9h 30m', remarks: 'Tower crane op' },
  { id: 4, emp_id: 'EMP-004', name: 'Arun Prakash', dept: 'Civil Engineering', designation: 'Junior Engineer', site: 'Tower A', check_in: '09:05 AM', check_out: '06:30 PM', status: 'Present', hours: '9h 25m', remarks: 'Steel inspection' },
  { id: 5, emp_id: 'EMP-005', name: 'K. Balaji', dept: 'Stores & Inventory', designation: 'Store Incharge', site: 'Tower A', check_in: '08:50 AM', check_out: '06:20 PM', status: 'Present', hours: '9h 30m', remarks: 'Cement GRN received' },
  { id: 6, emp_id: 'EMP-006', name: 'V. Sundaram', dept: 'Electrical', designation: 'Chief Electrician', site: 'Tower A', check_in: '09:00 AM', check_out: '01:30 PM', status: 'Half Day', hours: '4h 30m', remarks: 'Permission afternoon' },
  { id: 7, emp_id: 'EMP-007', name: 'Priya Sharma', dept: 'Safety & Quality', designation: 'Safety Officer', site: 'Tower A', check_in: '—', check_out: '—', status: 'Leave', hours: '0h', remarks: 'Sick leave approved' },
  { id: 8, emp_id: 'EMP-008', name: 'Rajesh G.', dept: 'Civil Engineering', designation: 'Supervisor', site: 'Tower A', check_in: '—', check_out: '—', status: 'Absent', hours: '0h', remarks: 'Uninformed' },
  { id: 9, emp_id: 'EMP-009', name: 'S. Selvam', dept: 'Plant & Machinery', designation: 'Mechanic', site: 'Tower A', check_in: '08:30 AM', check_out: '05:30 PM', status: 'Present', hours: '9h 00m', remarks: 'Mixer maintenance' },
  { id: 10, emp_id: 'EMP-010', name: 'D. Vignesh', dept: 'Civil Engineering', designation: 'Surveyor', site: 'Tower A', check_in: '08:45 AM', check_out: '06:00 PM', status: 'Present', hours: '9h 15m', remarks: 'Grid line marking' }
];

const ManualAttendance = () => {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSite, setSelectedSite] = useState('Tower A');
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [savedAlert, setSavedAlert] = useState(false);

  const statusList = ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekly Off'];

  const filtered = attendance.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        item.emp_id.toLowerCase().includes(search.toLowerCase());
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

  const handleSubmit = () => {
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
              <option value="Tower A">Tower A</option>
              <option value="Tower B">Tower B</option>
              <option value="Villa Project">Villa Project</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Commercial">Commercial</option>
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
