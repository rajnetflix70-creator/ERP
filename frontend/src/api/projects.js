import apiClient from './client';

export const getProjects = (params = {}) =>
  apiClient.get('/projects', { params }).then(r => r.data);

export const getProjectStats = () =>
  apiClient.get('/projects/stats').then(r => r.data);

export const getProject = (id) =>
  apiClient.get(`/projects/${id}`).then(r => r.data);

export const createProject = (data) =>
  apiClient.post('/projects', data).then(r => r.data);

export const updateProject = (id, data) =>
  apiClient.put(`/projects/${id}`, data).then(r => r.data);

export const deleteProject = (id) =>
  apiClient.delete(`/projects/${id}`).then(r => r.data);
