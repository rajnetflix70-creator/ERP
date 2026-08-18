import apiClient from './client';

export const getMaterials     = (params = {}) => apiClient.get('/materials', { params }).then(r => r.data);
export const getMaterial      = (id)          => apiClient.get(`/materials/${id}`).then(r => r.data);
export const createMaterial   = (data)        => apiClient.post('/materials', data).then(r => r.data);
export const updateMaterial   = (id, data)    => apiClient.put(`/materials/${id}`, data).then(r => r.data);
export const deleteMaterial   = (id)          => apiClient.delete(`/materials/${id}`).then(r => r.data);
export const getLowStock      = ()            => apiClient.get('/materials/low-stock').then(r => r.data);

export const getMaterialRequests = (params = {}) => apiClient.get('/materials/requests/all', { params }).then(r => r.data);
export const createMaterialRequest = (data)  => apiClient.post('/materials/requests', data).then(r => r.data);
export const approveRequest   = (id, data)   => apiClient.put(`/materials/requests/${id}/approve`, data).then(r => r.data);
export const issueRequest     = (id, data)   => apiClient.put(`/materials/requests/${id}/issue`, data).then(r => r.data);

export const getSiteStock     = (params = {}) => apiClient.get('/materials/stock/site', { params }).then(r => r.data);
export const logConsumption   = (data)       => apiClient.post('/materials/consumption', data).then(r => r.data);
export const getConsumptionHistory = (params = {}) => apiClient.get('/materials/consumption/history', { params }).then(r => r.data);
