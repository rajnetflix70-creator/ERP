import React, { useState } from 'react';

// System default workflow configurations (approval templates, NOT demo data)
// These represent the out-of-the-box ERP workflow structure.
const DEFAULT_WORKFLOW_TEMPLATES = [
  {
    id: 'wf-mr',
    module: 'Material Request (MR)',
    description: 'Approval pipeline for site material indent requisitions',
    icon: '📤',
    enabled: true,
    levels: [
      { step: 1, role: 'Site Engineer', threshold: 'All values', action: 'Draft & Initial Site Check', autoApprove: false },
      { step: 2, role: 'Project Manager', threshold: 'Up to ₹2,00,000', action: 'Technical & BOQ Feasibility Review', autoApprove: false },
      { step: 3, role: 'Purchase Manager', threshold: 'Above ₹2,00,000', action: 'Commercial & Vendor Stock Check', autoApprove: false },
      { step: 4, role: 'Management / Director', threshold: 'Above ₹10,00,000', action: 'Executive CapEx Approval', autoApprove: false },
    ]
  },
  {
    id: 'wf-po',
    module: 'Purchase Order (PO)',
    description: 'Commercial procurement issuance & vendor contract sign-off',
    icon: '🛒',
    enabled: true,
    levels: [
      { step: 1, role: 'Purchase Executive', threshold: 'All POs', action: 'Draft PO & Quotation Comparison', autoApprove: false },
      { step: 2, role: 'Purchase Manager', threshold: 'Up to ₹5,00,000', action: 'Rate Negotiation & Terms Sign-off', autoApprove: false },
      { step: 3, role: 'Finance / Accounts Head', threshold: 'Above ₹5,00,000', action: 'Budget & Payment Term Verification', autoApprove: false },
      { step: 4, role: 'Director / Management', threshold: 'Above ₹25,00,000', action: 'High Value Contract Sanction', autoApprove: false },
    ]
  },
  {
    id: 'wf-grn',
    module: 'Goods Receipt Note (GRN)',
    description: 'Inward gate inspection, quality verification and inventory stock crediting',
    icon: '📥',
    enabled: true,
    levels: [
      { step: 1, role: 'Store Keeper / Incharge', threshold: 'All Inward Shipments', action: 'Weighbridge & Piece Count Verification', autoApprove: false },
      { step: 2, role: 'Site Quality Engineer', threshold: 'Mandatory on Structural Items', action: 'MTC & Quality Checklist Clearance', autoApprove: false },
    ]
  },
  {
    id: 'wf-att',
    module: 'Workforce Attendance Muster',
    description: 'Daily labor muster roll, overtime verification and payroll locking',
    icon: '👷',
    enabled: true,
    levels: [
      { step: 1, role: 'Site Supervisor', threshold: 'Daily Muster', action: 'Muster Roll Entry & Check-In Log', autoApprove: false },
      { step: 2, role: 'Site Manager', threshold: 'Site Review', action: 'Daily Work Hours & Overtime Clearance', autoApprove: false },
      { step: 3, role: 'HR / Payroll Manager', threshold: 'Weekly / Monthly', action: 'Wage Calculation & Attendance Lock', autoApprove: false },
    ]
  }
];

const ApprovalWorkflowSettings = () => {
  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOW_TEMPLATES);
  const [selectedWorkflow, setSelectedWorkflow] = useState(DEFAULT_WORKFLOW_TEMPLATES[0]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleToggleWorkflow = (id) => {
    const updated = workflows.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    setWorkflows(updated);
    if (selectedWorkflow.id === id) {
      setSelectedWorkflow({ ...selectedWorkflow, enabled: !selectedWorkflow.enabled });
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Workflows</h1>
          <p className="page-subtitle">Configure multi-tier hierarchical approval gates, financial thresholds, and role sanctions</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 Save Workflow Rules
        </button>
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          ✓ Approval workflow policies and escalation hierarchies updated!
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Workflow Modules List */}
        <div className="card" style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px 12px', borderBottom: '1px solid var(--border)' }}>
            Workflow Modules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {workflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${selectedWorkflow.id === wf.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedWorkflow.id === wf.id ? 'var(--primary-50)' : '#fff',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{wf.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--navy)' }}>
                      {wf.module}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {wf.levels.length} Tier Hierarchy
                    </div>
                  </div>
                </div>

                <span className={`badge ${wf.enabled ? 'badge-success' : 'badge-default'}`}>
                  {wf.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Workflow Editor */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: 'var(--primary)' }}>
                {selectedWorkflow.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy)', margin: 0 }}>
                  {selectedWorkflow.module} Hierarchy
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedWorkflow.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`btn btn-sm ${selectedWorkflow.enabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => handleToggleWorkflow(selectedWorkflow.id)}
            >
              {selectedWorkflow.enabled ? 'Pause Workflow' : 'Activate Workflow'}
            </button>
          </div>

          {/* Visual Step by Step Tier Builder */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--navy)', marginBottom: '14px' }}>
            Multi-Tier Sanction Pipeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedWorkflow.levels.map((lvl, idx) => (
              <div
                key={lvl.step}
                style={{
                  position: 'relative',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>
                      {lvl.step}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--navy)' }}>
                        Tier {lvl.step}: {lvl.role}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {lvl.action}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      Threshold: {lvl.threshold}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Assigned Approver Role</label>
                    <select
                      value={lvl.role}
                      onChange={e => {
                        const newLevels = [...selectedWorkflow.levels];
                        newLevels[idx].role = e.target.value;
                        setSelectedWorkflow({ ...selectedWorkflow, levels: newLevels });
                      }}
                      className="form-control"
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    >
                      <option value="Site Engineer">Site Engineer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Purchase Manager">Purchase Manager</option>
                      <option value="Purchase Executive">Purchase Executive</option>
                      <option value="Store Keeper / Incharge">Store Keeper / Incharge</option>
                      <option value="Site Quality Engineer">Site Quality Engineer</option>
                      <option value="Site Supervisor">Site Supervisor</option>
                      <option value="Finance / Accounts Head">Finance / Accounts Head</option>
                      <option value="HR / Payroll Manager">HR / Payroll Manager</option>
                      <option value="Director / Management">Director / Management</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Value Threshold Trigger</label>
                    <input
                      type="text"
                      value={lvl.threshold}
                      onChange={e => {
                        const newLevels = [...selectedWorkflow.levels];
                        newLevels[idx].threshold = e.target.value;
                        setSelectedWorkflow({ ...selectedWorkflow, levels: newLevels });
                      }}
                      className="form-control"
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Required Verification</label>
                    <input
                      type="text"
                      value={lvl.action}
                      onChange={e => {
                        const newLevels = [...selectedWorkflow.levels];
                        newLevels[idx].action = e.target.value;
                        setSelectedWorkflow({ ...selectedWorkflow, levels: newLevels });
                      }}
                      className="form-control"
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const nextStep = selectedWorkflow.levels.length + 1;
                const newLevels = [
                  ...selectedWorkflow.levels,
                  { step: nextStep, role: 'Project Manager', threshold: 'Above ₹5,00,000', action: 'Review & Sign-off', autoApprove: false }
                ];
                setSelectedWorkflow({ ...selectedWorkflow, levels: newLevels });
              }}
            >
              + Add Approval Tier
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflowSettings;
