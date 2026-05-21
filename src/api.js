import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase,
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
