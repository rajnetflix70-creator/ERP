import apiClient from './client';

export const getEmployees = (params = {}) =>
  apiClient.get('/employees', { params }).then(r => r.data);

export const getEmployee = (id) =>
  apiClient.get(`/employees/${id}`).then(r => r.data);

export const createEmployee = (data) =>
  apiClient.post('/employees', data).then(r => r.data);

export const updateEmployee = (id, data) =>
  apiClient.put(`/employees/${id}`, data).then(r => r.data);

export const deactivateEmployee = (id) =>
  apiClient.delete(`/employees/${id}`).then(r => r.data);

export const getRoles = () =>
  apiClient.get('/employees/roles').then(r => r.data);
