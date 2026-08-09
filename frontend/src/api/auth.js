import apiClient from './client';

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (full_name, email, password) => {
  const response = await apiClient.post('/auth/register', { full_name, email, password });
  return response.data;
};

export const requestOtp = async (mobile_number) => {
  const response = await apiClient.post('/auth/request-otp', { mobile_number });
  return response.data;
};

export const verifyOtp = async (mobile_number, code) => {
  const response = await apiClient.post('/auth/verify-otp', { mobile_number, code });
  return response.data;
};

export const googleAuth = async (idToken) => {
  const response = await apiClient.post('/auth/google', { token: idToken });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
