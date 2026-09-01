import React, { useState, useEffect } from 'react';
import { getLaborCostSummary, setEmployeeWages } from '../api/attendance';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

const PayrollSummary = () => {
  const { t } = useTranslation();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [wageData, setWageData] = useState({ daily_rate: 0, ot_rate_per_hour: 0 });
  const [savingWage, setSavingWage] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getLaborCostSummary(month);
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [month]);

  const handleEditWages = (user) => {
    setSelectedUser(user);
    setWageData({
      daily_rate: user.daily_rate || 0,
      ot_rate_per_hour: user.ot_rate || 0
    });
  };

  const handleSaveWages = async () => {
    setSavingWage(true);
    try {
      await setEmployeeWages(selectedUser.user_id, wageData);
      setSelectedUser(null);
      loadSummary();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWage(false);
    }
  };

  return (
    <div style={{ padding: '0 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">💵 Payroll Summary</h1>
          <p className="page-subtitle">Calculate gross pay based on daily rate, overtime rate, and attendance.</p>
        </div>
        <div>
          <input
            type="month"
            className="form-control"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ fontWeight: 700 }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Days Present</th>
                  <th style={{ textAlign: 'right' }}>Daily Rate (AED)</th>
                  <th style={{ textAlign: 'right' }}>OT Hours</th>
                  <th style={{ textAlign: 'right' }}>OT Rate (AED)</th>
                  <th style={{ textAlign: 'right' }}>Gross Pay (AED)</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(s => (
                  <tr key={s.user_id}>
                    <td><strong>{s.full_name}</strong></td>
                    <td>{s.role}</td>
                    <td style={{ textAlign: 'right' }}>{s.days_present}</td>
                    <td style={{ textAlign: 'right' }}>{s.daily_rate}</td>
                    <td style={{ textAlign: 'right' }}>{s.ot_hours}</td>
                    <td style={{ textAlign: 'right' }}>{s.ot_rate}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>
                      {s.gross_pay.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEditWages(s)}>
                        ⚙️ Setup Wages
                      </button>
                    </td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No attendance data found for {month}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup Wages Popup */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={selectedUser ? `Setup Wages: ${selectedUser.full_name}` : 'Setup Wages'} icon="⚙️" size="sm">
        <div style={{ marginBottom: 12 }}>
          <label className="form-label">Daily Rate (AED)</label>
          <input
            type="number"
            className="form-control"
            value={wageData.daily_rate}
            onChange={e => setWageData({ ...wageData, daily_rate: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Overtime Rate per Hour (AED)</label>
          <input
            type="number"
            className="form-control"
            value={wageData.ot_rate_per_hour}
            onChange={e => setWageData({ ...wageData, ot_rate_per_hour: e.target.value })}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveWages} disabled={savingWage}>
            {savingWage ? 'Saving...' : 'Save Wages'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollSummary;
