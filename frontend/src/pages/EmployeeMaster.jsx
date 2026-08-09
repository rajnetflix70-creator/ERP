import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getEmployees, createEmployee, updateEmployee, deactivateEmployee, getRoles,
} from '../api/employees';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  full_name: '', email: '', mobile_number: '', password: '',
  role_id: '', preferred_language: 'en', is_active: true,
};

const EmployeeMaster = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type, message }

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterActive !== '') params.is_active = filterActive;
      const data = await getEmployees(params);
      setEmployees(data);
    } catch (e) {
      setAlert({ type: 'error', message: e.response?.data?.message || 'Failed to load employees' });
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterActive]);

  useEffect(() => {
    getRoles().then(setRoles).catch(() => {});
    loadEmployees();
  }, [loadEmployees]);

  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterActive]);

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const pagedEmployees = employees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, role_id: roles.find(r => r.name === 'worker')?.id || '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditTarget(emp);
    setForm({
      full_name: emp.full_name || '',
      email: emp.email || '',
      mobile_number: emp.mobile_number || '',
      password: '',
      role_id: emp.role_id || '',
      preferred_language: emp.preferred_language || 'en',
      is_active: emp.is_active,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = { ...form };
      // Don't send empty password on edit
      if (!payload.password) delete payload.password;
      if (!payload.email) delete payload.email;
      if (!payload.mobile_number) delete payload.mobile_number;
      payload.role_id = parseInt(payload.role_id);

      if (editTarget) {
        await updateEmployee(editTarget.id, payload);
        setAlert({ type: 'success', message: `${form.full_name} updated successfully.` });
      } else {
        await createEmployee(payload);
        setAlert({ type: 'success', message: `${form.full_name} added successfully.` });
      }
      setModalOpen(false);
      loadEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (emp) => {
    if (!window.confirm(`Deactivate ${emp.full_name}? They will not be able to log in.`)) return;
    try {
      await deactivateEmployee(emp.id);
      setAlert({ type: 'success', message: `${emp.full_name} deactivated.` });
      loadEmployees();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Deactivation failed' });
    }
  };

  const roleLabel = (name) => {
    const map = { super_admin: 'Super Admin', company_admin: 'Admin', site_supervisor: 'Supervisor', worker: 'Worker' };
    return map[name] || name;
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">👤 {t('nav.employeeMaster')}</h1>
        <p className="page-subtitle">Manage all company employees — create, edit, and deactivate.</p>
      </div>

      {/* Alert */}
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

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Name, email or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
            <label className="form-label">Role</label>
            <select className="form-control" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              {roles.map(r => <option key={r.id} value={r.name}>{roleLabel(r.name)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '0 0 140px', marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadEmployees}>🔍 Filter</button>
          <button className="btn btn-primary" style={{ marginInlineStart: 'auto' }} onClick={openCreate}>
            + Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No employees found</h3>
            <p>Try adjusting filters or add a new employee.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Site</th>
                <th>Language</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedEmployees.map((emp, idx) => (
                <tr key={emp.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{emp.full_name}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{emp.email || '—'}</td>
                  <td style={{ fontSize: '0.88rem' }}>{emp.mobile_number || '—'}</td>
                  <td>
                    <span className={`badge ${emp.role === 'worker' ? 'badge-consumable' : 'badge-asset'}`}>
                      {roleLabel(emp.role)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>{emp.site_name || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {{ en: '🇬🇧 EN', ar: '🇦🇪 AR', hi: '🇮🇳 HI' }[emp.preferred_language] || emp.preferred_language}
                  </td>
                  <td>
                    <span className={`badge ${emp.is_active ? 'badge-present' : 'badge-absent'}`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}>✏️ Edit</button>
                      {emp.is_active && (
                        <button className="btn btn-sm" style={{ background: 'var(--color-danger-lt)', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)' }} onClick={() => handleDeactivate(emp)}>
                          🚫 Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
          Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, employees.length)}–{Math.min(currentPage * PAGE_SIZE, employees.length)} of {employees.length} employees
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

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Employee' : 'Add New Employee'} subtitle={editTarget ? `Updating ${editTarget.full_name}` : 'Fill in employee details below'} icon="👤" size="lg">
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>❌ {formError}</div>
          )}

          <div className="form-section">
            <div className="form-section-title">Personal Information</div>
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input className="form-control" name="full_name" value={form.full_name} onChange={handleFormChange} required placeholder="e.g. Ahmed Al Mansoori" />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="email@company.ae" />
                <p className="form-hint">Required if no mobile</p>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile (E.164)</label>
                <input className="form-control" name="mobile_number" value={form.mobile_number} onChange={handleFormChange} placeholder="+971501234567" />
                <p className="form-hint">Required if no email</p>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Security</div>
            <div className="form-group">
              <label className="form-label">{editTarget ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input className="form-control" name="password" type="password" value={form.password} onChange={handleFormChange} placeholder={editTarget ? '••••••••' : 'Min 6 characters'} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Role & Preferences</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Role <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select className="form-control" name="role_id" value={form.role_id} onChange={handleFormChange} required>
                  <option value="">Select role…</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{roleLabel(r.name)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Language</label>
                <select className="form-control" name="preferred_language" value={form.preferred_language} onChange={handleFormChange}>
                  <option value="en">🇬🇧 English</option>
                  <option value="ar">🇦🇪 Arabic</option>
                  <option value="hi">🇮🇳 Hindi</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleFormChange} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', borderRadius: 4 }} />
              <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Active (can log in)</label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <><span className="spinner" /> Saving…</> : (editTarget ? '💾 Save Changes' : '➕ Add Employee')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeMaster;
