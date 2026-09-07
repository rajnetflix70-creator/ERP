import React, { useState, useEffect } from 'react';
import client from '../api/client';

const MaterialConsumptionReport = () => {
  const [projects, setProjects] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterProject, setFilterProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [summaryInfo, setSummaryInfo] = useState({
    projectName: 'All',
    projectLocation: 'All',
    jobNo: 'N.A',
    totalArea: '348319',
    startDate: '',
    endDate: ''
  });

  const fetchProjects = async () => {
    try {
      const res = await client.get('/projects');
      setProjects(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterProject) params.project_id = filterProject;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await client.get('/materials/consumption/history', { params });
      const rawData = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];

      // Update Summary Header Card
      const selProj = projects.find(p => String(p.id) === String(filterProject));
      setSummaryInfo({
        projectName: selProj ? (selProj.project_name || selProj.name) : 'All',
        projectLocation: selProj ? (selProj.location || selProj.address || 'Dubai, UAE') : 'All',
        jobNo: selProj ? (selProj.ak_job_no || selProj.code || 'N.A') : 'N.A',
        totalArea: selProj ? (selProj.total_area || '348319') : '348319',
        startDate: startDate || 'N.A',
        endDate: endDate || 'N.A'
      });

      setReportData(rawData);
    } catch (err) {
      console.error(err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchReport();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport();
  };

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
        Daily Material Consumption Report
      </h2>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} style={{ background: '#fff', padding: '15px 20px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>Project :</label>
          <select 
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', minWidth: '180px' }}
          >
            <option value="">All Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code ? `${p.code} - ${p.name}` : p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>Start Date :</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>End Date :</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ background: '#2b5876', color: '#fff', padding: '6px 20px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
        >
          Search
        </button>
      </form>

      {/* Project Metadata Table Header */}
      <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 15px', fontWeight: '700', width: '20%', background: '#fafafa', borderRight: '1px solid #e2e8f0' }}>Project Name:</td>
              <td style={{ padding: '10px 15px', width: '30%', borderRight: '1px solid #e2e8f0' }}>{summaryInfo.projectName}</td>
              <td style={{ padding: '10px 15px', fontWeight: '700', width: '20%', background: '#fafafa', borderRight: '1px solid #e2e8f0' }}>Project Location</td>
              <td style={{ padding: '10px 15px', width: '30%' }}>{summaryInfo.projectLocation}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 15px', fontWeight: '700', background: '#fafafa', borderRight: '1px solid #e2e8f0' }}>Job No</td>
              <td style={{ padding: '10px 15px', borderRight: '1px solid #e2e8f0' }}>{summaryInfo.jobNo}</td>
              <td style={{ padding: '10px 15px', fontWeight: '700', background: '#fafafa', borderRight: '1px solid #e2e8f0' }}>Total Area</td>
              <td style={{ padding: '10px 15px' }}>{summaryInfo.totalArea}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 15px', fontWeight: '700', background: '#fafafa', borderRight: '1px solid #e2e8f0' }}>Start Date</td>
              <td style={{ padding: '10px 15px', borderRight: '1px solid #e2e8f0' }}>{summaryInfo.startDate}</td>
              <td style={{ padding: '10px 15px', fontWeight: '700', background: '#fafafa', borderRight: '1px solid #e2e8f0' }}>End Date</td>
              <td style={{ padding: '10px 15px' }}>{summaryInfo.endDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Material Details Table */}
      <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
            MATERIAL DETAILS
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 15px', width: '70px' }}>S.No</th>
                <th style={{ padding: '10px 15px', width: '120px' }}>Item Code</th>
                <th style={{ padding: '10px 15px' }}>Material Description</th>
                <th style={{ padding: '10px 15px', width: '100px' }}>Unit</th>
                <th style={{ padding: '10px 15px', width: '140px' }}>Qty Used</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : reportData.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No material consumption records found</td></tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '10px 15px', color: '#666' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 15px', color: '#4a5568' }}>{1001 + idx}</td>
                    <td style={{ padding: '10px 15px', fontWeight: '500', color: '#2d3748' }}>
                      {row.material_name || `Material Item ${idx + 1}`}
                    </td>
                    <td style={{ padding: '10px 15px', color: '#718096' }}>{row.unit || 'pcs'}</td>
                    <td style={{ padding: '10px 15px', fontWeight: '700', color: '#2d3748' }}>
                      {row.qty_consumed || row.quantity || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialConsumptionReport;
