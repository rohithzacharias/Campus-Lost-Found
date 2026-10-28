import axios from 'axios';
import store from './store';
import { logout } from './userSlice';

// Normalize base URL so endpoints always connect properly
let rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
rawBase = rawBase.trim().replace(/\/+$/, '');
if (rawBase.endsWith('/api/v1')) {
  rawBase = rawBase.replace(/\/api\/v1$/, '/api');
} else if (!rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}

export const API_BASE_URL = rawBase;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusfind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatically handle 401 token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we got a 401 and were not hitting the login endpoint
      const isAuthCall = error.config && (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register'));
      if (!isAuthCall) {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
