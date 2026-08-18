// src/lib/api/axios.ts
import axios from 'axios';
import { toast } from 'sonner';

const normalizeBaseURL = (value?: string) => {
  if (!value) {
    return 'http://localhost:4006/api';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 'http://localhost:4006/api';
  }

  return trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/$/, '')}/api`;
};

const api = axios.create({
  baseURL: normalizeBaseURL(import.meta.env.VITE_API_URL),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('🌐 Network error');
      toast.error('Network error. Please check your internet connection.');
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      toast.error('Request timed out. Please try again.');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data;

    console.error('❌ Response error:', {
      url: error.config?.url,
      status: status,
      message: error.message
    });

    // Handle 401 Unauthorized
    if (status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      const message = data?.message || 'You do not have permission.';
      toast.error(message);
    }

    // Handle 409 Conflict
    if (status === 409) {
      const message = data?.message || 'Duplicate entry detected.';
      toast.error(message);
    }

    // Handle validation errors
    if (status === 422) {
      const message = data?.message || 'Validation error.';
      toast.error(message);
    }

    // Handle server errors
    if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    // If we have response data, pass it along
    if (data) {
      error.responseData = data;
    }

    return Promise.reject(error);
  }
);

// Helper: Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Helper: Get current user from localStorage
export const getCurrentUser = (): any => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Helper: Set auth data
export const setAuthData = (token: string, user: any): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Helper: Clear auth data
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;