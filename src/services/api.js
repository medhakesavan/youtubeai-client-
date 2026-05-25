import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📡 [API Request] ${config.method.toUpperCase()} ${config.url} - Token Attached`);
    } else if (!config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
      console.warn(`📡 [API Request] ${config.method.toUpperCase()} ${config.url} - NO TOKEN FOUND`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic for status handling is also in AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
