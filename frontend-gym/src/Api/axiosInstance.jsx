// src/utils/axiosInstance.js (or wherever you have it)
import axios from 'axios';
import BaseUrl from './BaseUrl';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: BaseUrl,
});

// Request Interceptor to attach the token to the headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      if (!config.headers) config.headers = {};
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isLoginRequest = url.includes('/login');
      const isNotifRequest = url.includes('/notif/');
      // Only clear token and redirect for auth-protected routes (not login, not notif reads)
      if (!isLoginRequest && !isNotifRequest) {
        const token = localStorage.getItem('authToken');
        // Only redirect if token actually exists (expired token), not for missing token
        if (token) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userData');
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;