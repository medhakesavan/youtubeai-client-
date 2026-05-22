import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - maybe clear some local state if needed
      // But don't redirect to login here to avoid loops in AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
