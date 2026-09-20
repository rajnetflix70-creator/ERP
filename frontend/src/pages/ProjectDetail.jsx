import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectDetails, saveProjectSlab, deleteProjectSlab } from '../api/projects';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slabs');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getProjectDetails(id);
      setProject(res.data);
    } catch (err) {
      toast.error('Could not load project details from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading Project Command Hub...
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="⚠️"
        title="Project Not Found"
        description="The requested project does not exist in the database."
        actionLabel="Back to Projects Hub"
        onAction={() => navigate('/projects')}
      />
    );
  }

  const slabs = project.slabs || [];
  const drawings = project.drawings || [];
  const supervisors = project.supervisors || [];
  const commercials = project.commercials || {};

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title={project.name}
        subtitle={`Job Code: ${project.code || 'AK-PT'} • Client: ${project.client || 'Direct'} • Location: ${project.location || 'UAE'}`}
        icon="🏗️"
        tag={project.status?.toUpperCase() || 'ACTIVE'}
        breadcrumbs={['Overview', 'Projects & PT Hub', project.name]}
        actions={
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-secondary text-xs px-3.5 py-2"
          >
            ← Back to Directory
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tender Net Area"
          value={project.tender_net_area ? `${Number(project.tender_net_area).toLocaleString()} m²` : '—'}
          badgeText="Specifications"
          color="blue"
        />
        <StatCard
          label="Floor Slabs Count"
          value={slabs.length}
          badgeText="Total Levels"
          color="emerald"
        />
        <StatCard
          label="Engineering Drawings"
          value={drawings.length}
          badgeText="As-Builts"
          color="amber"
        />
        <StatCard
          label="Contract Budget"
          value={commercials.contract_amount ? `AED ${Number(commercials.contract_amount).toLocaleString()}` : '—'}
          badgeText="Commercial"
          color="purple"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('slabs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'slabs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏗️</span> Floor Slabs ({slabs.length})
          </button>
          <button
            onClick={() => setActiveTab('drawings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'drawings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📐</span> Drawings & As-Builts ({drawings.length})
          </button>
          <button
            onClick={() => setActiveTab('supervisors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'supervisors' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👷</span> Assigned Supervisors ({supervisors.length})
          </button>
          <button
            onClick={() => setActiveTab('commercials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'commercials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💰</span> Commercial & Billing
          </button>
        </div>

        {activeTab === 'slabs' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Level / Floor</th>
                  <th className="py-3 px-4">Tender Area</th>
                  <th className="py-3 px-4">Concreting</th>
                  <th className="py-3 px-4">Stressing</th>
                  <th className="py-3 px-4">Grouting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {slabs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No floor slabs recorded yet for this project.
                    </td>
                  </tr>
                ) : (
                  slabs.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{s.floor_name}</td>
                      <td className="py-3 px-4 font-mono">{s.area_sqft ? `${s.area_sqft} m²` : '—'}</td>
                      <td className="py-3 px-4"><Badge status={s.concreting_status} /></td>
                      <td className="py-3 px-4"><Badge status={s.stressing_status} /></td>
                      <td className="py-3 px-4"><Badge status={s.grouting_status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'drawings' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Drawing #</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drawings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No engineering drawings registered yet.
                    </td>
                  </tr>
                ) : (
                  drawings.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-blue-400 font-bold">{d.drawing_no}</td>
                      <td className="py-3 px-4 text-white font-medium">{d.drawing_title}</td>
                      <td className="py-3 px-4 font-mono">{d.revision_no}</td>
                      <td className="py-3 px-4">{d.submission_stage}</td>
                      <td className="py-3 px-4"><Badge status={d.approval_status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'supervisors' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {supervisors.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-500">
                No site supervisors assigned yet.
              </div>
            ) : (
              supervisors.map((sup) => (
                <div key={sup.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{sup.supervisor_name}</p>
                    <p className="text-xs text-slate-400">{sup.role_type || 'Site Supervisor'} • {sup.contact_phone || 'No phone'}</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-semibold bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                    Active on Site
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'commercials' && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
            <h5 className="font-bold text-xs text-slate-200">Commercial & Financial Summary</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Contract Total</p>
                <p className="text-lg font-bold text-white font-mono mt-1">
                  AED {commercials.contract_amount ? Number(commercials.contract_amount).toLocaleString() : '—'}
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Total Claimed</p>
                <p className="text-lg font-bold text-blue-400 font-mono mt-1">
                  AED {commercials.claimed_amount ? Number(commercials.claimed_amount).toLocaleString() : '0'}
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Certified</p>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  AED {commercials.certified_amount ? Number(commercials.certified_amount).toLocaleString() : '0'}
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Received</p>
                <p className="text-lg font-bold text-purple-400 font-mono mt-1">
                  AED {commercials.received_amount ? Number(commercials.received_amount).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
