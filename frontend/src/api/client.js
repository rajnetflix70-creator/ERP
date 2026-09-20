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
  timeout: 15000,
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
    // Network offline / unreachable
    if (!error.response) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('erp:network-error', {
          detail: { message: 'Network connection failed. Please check your internet connection.' }
        }));
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // 401 Unauthorized / Token Expired
    if (status === 401) {
      const code = data?.code || 'UNAUTHORIZED';
      const isExpired = code === 'TOKEN_EXPIRED';

      localStorage.removeItem('sitetrack_token');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('erp:session-expired', {
          detail: { 
            message: isExpired ? 'Session expired. Please log in again.' : 'Authentication required.',
            isExpired
          }
        }));

        // Give toast 1.5 seconds to be seen before redirect
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = `/login?reason=${isExpired ? 'expired' : 'unauthorized'}`;
          }
        }, 1500);
      }
    }

    // 403 Forbidden
    if (status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('erp:forbidden', {
          detail: { message: data?.message || 'Access denied: You lack permission for this action.' }
        }));
      }
    }

    // 503 Database / Service Unavailable
    if (status === 503) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('erp:server-unavailable', {
          detail: { message: data?.message || 'Database server is temporarily unavailable.' }
        }));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

