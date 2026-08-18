import apiClient from './client';

export const getWorkPackages  = (params = {}) => apiClient.get('/work-packages', { params }).then(r => r.data);
export const getKanbanBoard   = (project_id)  => apiClient.get('/work-packages/kanban', { params: project_id ? { project_id } : {} }).then(r => r.data);
export const getWorkPackage   = (id)          => apiClient.get(`/work-packages/${id}`).then(r => r.data);
export const createWorkPackage= (data)        => apiClient.post('/work-packages', data).then(r => r.data);
export const updateWorkPackage= (id, data)    => apiClient.put(`/work-packages/${id}`, data).then(r => r.data);
export const deleteWorkPackage= (id)          => apiClient.delete(`/work-packages/${id}`).then(r => r.data);
export const logProgress      = (id, data)    => apiClient.post(`/work-packages/${id}/progress`, data).then(r => r.data);
export const getProgressLogs  = (id)          => apiClient.get(`/work-packages/${id}/progress`).then(r => r.data);
