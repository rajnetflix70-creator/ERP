import apiClient from './client';

export const getEquipmentMachines = (params = {}) =>
  apiClient.get('/equipment-machines', { params }).then(r => r.data);

export const getEquipmentMachineStats = () =>
  apiClient.get('/equipment-machines/stats').then(r => r.data);

export const getDailyEquipmentGrid = (params = {}) =>
  apiClient.get('/equipment-machines/daily-grid', { params }).then(r => r.data);

export const getSiteGroupedFleet = (params = {}) =>
  apiClient.get('/equipment-machines/site-fleet', { params }).then(r => r.data);

export const getCalibrationSummary = () =>
  apiClient.get('/equipment-machines/calibration-summary').then(r => r.data);

export const updateDailyEquipmentLog = (data) =>
  apiClient.post('/equipment-machines/daily-log', data).then(r => r.data);

export const createEquipmentMachine = (data) =>
  apiClient.post('/equipment-machines', data).then(r => r.data);

export const updateEquipmentMachine = (id, data) =>
  apiClient.put(`/equipment-machines/${id}`, data).then(r => r.data);

export const deleteEquipmentMachine = (id) =>
  apiClient.delete(`/equipment-machines/${id}`).then(r => r.data);
