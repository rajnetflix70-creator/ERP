import apiClient from './client';

export const getPRs = () => apiClient.get('/procurement/pr').then(res => res.data);
export const createPR = (data) => apiClient.post('/procurement/pr', data).then(res => res.data);
export const approvePR = (id, status) => apiClient.put(`/procurement/pr/${id}/approve`, { status }).then(res => res.data);

export const getPOs = () => apiClient.get('/procurement/po').then(res => res.data);
export const createPO = (data) => apiClient.post('/procurement/po', data).then(res => res.data);
export const updatePOStatus = (id, status) => apiClient.put(`/procurement/po/${id}/status`, { status }).then(res => res.data);

export const createGRN = (data) => apiClient.post('/procurement/grn', data).then(res => res.data);
