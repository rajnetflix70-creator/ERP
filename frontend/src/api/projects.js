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

export const getProjectDetails = (id) =>
  apiClient.get(`/projects/${id}/details`).then(r => r.data);


/* Slabs */
export const getProjectSlabs = (id) =>
  apiClient.get(`/projects/${id}/slabs`).then(r => r.data);

export const saveProjectSlab = (id, data) =>
  apiClient.post(`/projects/${id}/slabs`, data).then(r => r.data);

export const batchSaveProjectSlabs = (id, slabs) =>
  apiClient.put(`/projects/${id}/slabs/batch`, { slabs }).then(r => r.data);

export const deleteProjectSlab = (id, slabId) =>
  apiClient.delete(`/projects/${id}/slabs/${slabId}`).then(r => r.data);

/* Drawings */
export const getProjectDrawings = (id) =>
  apiClient.get(`/projects/${id}/drawings`).then(r => r.data);

export const createProjectDrawing = (id, data) =>
  apiClient.post(`/projects/${id}/drawings`, data).then(r => r.data);

export const updateProjectDrawing = (id, drawingId, data) =>
  apiClient.put(`/projects/${id}/drawings/${drawingId}`, data).then(r => r.data);

export const deleteProjectDrawing = (id, drawingId) =>
  apiClient.delete(`/projects/${id}/drawings/${drawingId}`).then(r => r.data);

/* Supervisors */
export const getProjectSupervisors = (id) =>
  apiClient.get(`/projects/${id}/supervisors`).then(r => r.data);

export const addProjectSupervisor = (id, data) =>
  apiClient.post(`/projects/${id}/supervisors`, data).then(r => r.data);

export const deleteProjectSupervisor = (id, supervisorId) =>
  apiClient.delete(`/projects/${id}/supervisors/${supervisorId}`).then(r => r.data);

/* Commercials */
export const getProjectCommercials = (id) =>
  apiClient.get(`/projects/${id}/commercials`).then(r => r.data);

export const saveProjectCommercials = (id, data) =>
  apiClient.put(`/projects/${id}/commercials`, data).then(r => r.data);

