import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.includes('akconstruction.ae') || envUrl.includes('localhost')) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return '/api/v1';
    }
  }
  return envUrl || '/api/v1';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sitetrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sitetrack_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
