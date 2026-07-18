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
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Do not redirect if the request was for login
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/login');
      
      if (!isLoginRequest) {
        // Token might be expired, clear storage and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
        
        // Redirect to login page
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;