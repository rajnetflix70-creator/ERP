import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBulkAttendanceList, submitBulkAttendance, getAttendanceSummary } from '../api/attendance';

const formatDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayStr = () => formatDateStr(new Date());

const getOffsetDateStr = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDateStr(d);
};

const STATUS_OPTIONS = [
  { value: 'present', label: '🟢 Present', color: 'btn-success', badge: 'badge-present' },
  { value: 'absent', label: '🔴 Absent', color: 'btn-danger', badge: 'badge-absent' },
  { value: 'half_day', label: '🟡 Half Day', color: 'btn-warning', badge: 'badge-half-day' },
  { value: 'on_leave', label: '🔵 On Leave', color: 'btn-secondary', badge: 'badge-on-leave' },
];

const BulkAttendance = () => {
  const { t } = useTranslation();
  const todayStr = getTodayStr();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [alert, setAlert] = useState(null);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        getBulkAttendanceList(selectedDate),
        getAttendanceSummary(selectedDate),
      ]);
      setEmployees(listRes);
      setSummary(summaryRes);
    } catch (e) {
      setAlert({ type: 'error', message: 'Failed to load bulk attendance list' });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, selectedDate]);

  // Handle local status change for individual employee
  const handleStatusChange = (userId, newStatus) => {
    setEmployees(prev =>
      prev.map(emp => (emp.user_id === userId ? { ...emp, status: newStatus } : emp))
    );
  };

  const handleRemarkChange = (userId, newRemarks) => {
    setEmployees(prev =>
      prev.map(emp => (emp.user_id === userId ? { ...emp, remarks: newRemarks } : emp))
    );
  };

  const handleOvertimeChange = (userId, newOT) => {
    setEmployees(prev =>
      prev.map(emp => (emp.user_id === userId ? { ...emp, overtime_hours: newOT } : emp))
    );
  };

  // Bulk actions
  const handleSetAllStatus = (statusValue) => {
    setEmployees(prev => prev.map(emp => ({ ...emp, status: statusValue })));
    setAlert({ type: 'success', message: `Marked all active employees as "${statusValue.replace('_', ' ').toUpperCase()}". Remember to click Save.` });
  };

  // 1-Click Submit: Set all to present & submit in 1 click
  const handleOneClickAllPresent = async () => {
    setSubmitting(true);
    setAlert(null);
    try {
      const updatedRecords = employees.map(emp => ({
        user_id: emp.user_id,
        status: 'present',
        overtime_hours: emp.overtime_hours || 0,
        remarks: emp.remarks || '',
      }));

      await submitBulkAttendance({
        attendance_date: selectedDate,
        records: updatedRecords,
      });

      setAlert({
        type: 'success',
        message: `⚡ 1-Click Success! All ${updatedRecords.length} active employees marked PRESENT and saved for ${selectedDate}.`,
      });
      loadAttendance();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Bulk submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Regular submit button
  const handleSubmit = async () => {
    setSubmitting(true);
    setAlert(null);
    try {
      const recordsToSubmit = employees.map(emp => ({
        user_id: emp.user_id,
        status: emp.status,
        overtime_hours: emp.overtime_hours || 0,
        remarks: emp.remarks || '',
      }));

      await submitBulkAttendance({
        attendance_date: selectedDate,
        records: recordsToSubmit,
      });

      setAlert({
        type: 'success',
        message: `Saved attendance records for ${recordsToSubmit.length} employees on ${selectedDate}.`,
      });
      loadAttendance();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering
  const filteredEmployees = employees.filter(emp => {
    if (filterRole && emp.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = emp.full_name?.toLowerCase().includes(q);
      const matchEmail = emp.email?.toLowerCase().includes(q);
      const matchMobile = emp.mobile_number?.toLowerCase().includes(q);
      const matchRole = emp.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchMobile || matchRole;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const pagedEmployees = filteredEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">📅 {t('nav.bulkAttendance', 'Daily Bulk Attendance')}</h1>
          <p className="page-subtitle">List all active employees and insert/update daily attendance records with 1-click controls.</p>
        </div>
        <button
          className="btn btn-success btn-lg"
          onClick={handleOneClickAllPresent}
          disabled={submitting || loading || employees.length === 0}
          style={{ fontWeight: 800 }}
        >
          {submitting ? <><span className="spinner" /> Saving…</> : '⚡ 1-Click: Mark All Present & Save'}
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <span>{alert.type === 'success' ? '✅' : '❌'}</span>
          <span>{alert.message}</span>
          <button
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            onClick={() => setAlert(null)}
          >✕</button>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderColor: 'var(--color-header)' }}>
            <div className="stat-number" style={{ color: 'var(--color-header)' }}>{summary.total_employees}</div>
            <div className="stat-label">Active Employees</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--color-success)' }}>
            <div className="stat-number" style={{ color: 'var(--color-success)' }}>{summary.present}</div>
            <div className="stat-label">🟢 Present</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--color-danger)' }}>
            <div className="stat-number" style={{ color: 'var(--color-danger)' }}>{summary.absent}</div>
            <div className="stat-label">🔴 Absent</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--color-warning)' }}>
            <div className="stat-number" style={{ color: 'var(--color-warning)' }}>{summary.half_day + summary.on_leave}</div>
            <div className="stat-label">🟡 Half Day / On Leave</div>
          </div>
        </div>
      )}

      {/* Date & Bulk Controls Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        {/* Date Selector & Quick Pick */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-header)' }}>📅 Attendance Date:</span>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <button className={`btn btn-sm ${selectedDate === getOffsetDateStr(-1) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedDate(getOffsetDateStr(-1))}>
            ◀ Yesterday
          </button>
          <button className={`btn btn-sm ${selectedDate === todayStr ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedDate(todayStr)} style={{ fontWeight: 700 }}>
            ⭐ Today ({todayStr})
          </button>
          <button className={`btn btn-sm ${selectedDate === getOffsetDateStr(1) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedDate(getOffsetDateStr(1))}>
            Tomorrow ▶
          </button>
        </div>

        {/* Filters & Bulk Quick Toggles */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: '1 1 240px' }}>
            <input
              className="form-control"
              style={{ maxWidth: 260, flex: 1 }}
              placeholder="Search employee name, email, role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="form-control" style={{ maxWidth: 160, flex: 1 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="company_admin">Admin</option>
              <option value="site_supervisor">Supervisor</option>
              <option value="worker">Worker</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Quick Selection:</span>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSetAllStatus('present')}>
              Set All Present 🟢
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSetAllStatus('absent')}>
              Set All Absent 🔴
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || loading}>
              {submitting ? <><span className="spinner" /> Saving…</> : '💾 Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Employee List Table Wrapper */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No active employees found</h3>
              <p>Check search or filter criteria.</p>
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: 12, width: 40 }}>#</th>
                  <th style={{ padding: 12 }}>Employee Name</th>
                  <th style={{ padding: 12 }}>Role</th>
                  <th style={{ padding: 12 }}>Contact Info</th>
                  <th style={{ padding: 12, textAlign: 'center', minWidth: 320 }}>Daily Attendance Status</th>
                  <th style={{ padding: 12, width: 100 }}>Overtime (Hrs)</th>
                  <th style={{ padding: 12 }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {pagedEmployees.map((emp, idx) => (
                  <tr key={emp.user_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 12, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {(currentPage - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    <td className="font-semibold" style={{ padding: 12, color: 'var(--color-header)' }}>
                      {emp.full_name}
                    </td>

                    <td style={{ padding: 12 }}>
                      <span className="badge badge-asset" style={{ fontSize: '0.75rem' }}>
                        {emp.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: 12, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {emp.email || emp.mobile_number || '—'}
                    </td>

                    {/* Segmented Radio Buttons for Status */}
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', background: 'var(--color-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)', gap: 4 }}>
                        {STATUS_OPTIONS.map(opt => {
                          const isSelected = emp.status === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`btn btn-sm ${isSelected ? opt.color : 'btn-secondary'}`}
                              style={{
                                padding: '4px 10px', fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500,
                                border: isSelected ? undefined : 'none', opacity: isSelected ? 1 : 0.7,
                              }}
                              onClick={() => handleStatusChange(emp.user_id, opt.value)}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td style={{ padding: 12 }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={emp.overtime_hours}
                        onChange={e => handleOvertimeChange(emp.user_id, e.target.value)}
                      />
                    </td>

                    <td style={{ padding: 12 }}>
                      <input
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        placeholder="Optional notes..."
                        value={emp.remarks}
                        onChange={e => handleRemarkChange(emp.user_id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
          Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredEmployees.length)}–{Math.min(currentPage * PAGE_SIZE, filteredEmployees.length)} of {filteredEmployees.length} active employees
        </p>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ minWidth: 36, opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              ◀
            </button>

            {(() => {
              const pages = [];
              const show = new Set([1, totalPages]);
              for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) show.add(i);
              const sorted = [...show].sort((a, b) => a - b);
              sorted.forEach((page, idx) => {
                if (idx > 0 && page - sorted[idx - 1] > 1) {
                  pages.push(<span key={`e${page}`} style={{ padding: '0 6px', color: 'var(--color-text-muted)', fontSize: '0.85rem', userSelect: 'none' }}>…</span>);
                }
                pages.push(
                  <button
                    key={page}
                    className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentPage(page)}
                    style={{ minWidth: 36, fontWeight: page === currentPage ? 700 : 400 }}
                  >
                    {page}
                  </button>
                );
              });
              return pages;
            })()}

            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ minWidth: 36, opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkAttendance;
