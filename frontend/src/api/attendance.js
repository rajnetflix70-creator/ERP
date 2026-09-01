import apiClient from './client';

export const getBulkAttendanceList = (date, project_id) =>
  apiClient.get('/attendance/bulk-list', { params: { date, project_id } }).then(r => r.data);

export const submitBulkAttendance = (data) =>
  apiClient.post('/attendance/bulk-submit', data).then(r => r.data);

export const getAttendanceSummary = (date, project_id) =>
  apiClient.get('/attendance/summary', { params: { date, project_id } }).then(r => r.data);

export const getLaborCostSummary = (month) =>
  apiClient.get('/attendance/labor-cost-summary', { params: { month } }).then(r => r.data);

export const getAttendanceHistory = (userId, month) =>
  apiClient.get(`/attendance/history/${userId}`, { params: { month } }).then(r => r.data);

export const setEmployeeWages = (userId, data) =>
  apiClient.put(`/attendance/wages/${userId}`, data).then(r => r.data);
