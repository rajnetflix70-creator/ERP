import apiClient from './client';

export const getBulkAttendanceList = (date) =>
  apiClient.get('/attendance/bulk-list', { params: { date } }).then(r => r.data);

export const submitBulkAttendance = (data) =>
  apiClient.post('/attendance/bulk-submit', data).then(r => r.data);

export const getAttendanceSummary = (date) =>
  apiClient.get('/attendance/summary', { params: { date } }).then(r => r.data);
