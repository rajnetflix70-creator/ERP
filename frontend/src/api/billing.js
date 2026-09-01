import apiClient from './client';

export const getClients = () => apiClient.get('/billing/clients').then(res => res.data);
export const createClient = (data) => apiClient.post('/billing/clients', data).then(res => res.data);
export const updateClient = (id, data) => apiClient.put(`/billing/clients/${id}`, data).then(res => res.data);

export const getInvoices = () => apiClient.get('/billing/invoices').then(res => res.data);
export const getInvoiceById = (id) => apiClient.get(`/billing/invoices/${id}`).then(res => res.data);
export const createInvoice = (data) => apiClient.post('/billing/invoices', data).then(res => res.data);
export const updateInvoiceStatus = (id, status) => apiClient.patch(`/billing/invoices/${id}/status`, { status }).then(res => res.data);
export const recordPayment = (data) => apiClient.post('/billing/payments', data).then(res => res.data);
