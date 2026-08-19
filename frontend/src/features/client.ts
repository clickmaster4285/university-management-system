// src/lib/api/client.ts
import axios from 'axios';

const normalizeApiBase = (value?: string) => {
  const fallback = 'http://127.0.0.1:5010/api';
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
};

const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);


// Create axios instance with proper configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor - attach auth token + logging
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message ||
                     error.response.data?.error ||
                     `Server error: ${status}`;
      error.message = message;

      // Handle 401 - session expired, redirect to login
      if (status === 401) {
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                              error.config?.url?.includes('/auth/register');
        if (!isAuthEndpoint) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/login')) {
            setTimeout(() => { window.location.href = '/login'; }, 1500);
          }
        }
      }
    } else if (error.request) {
      error.message = 'Cannot connect to server. Please check if backend is running.';
    }

    return Promise.reject(error);
  }
);

// Helper function for making API calls (backward compatibility)
const makeRequest = async (method: string, endpoint: string, body?: any) => {
  try {
    // Ensure endpoint starts with /api
    const normalizedEndpoint = endpoint.startsWith('/api') 
      ? endpoint 
      : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await apiClient.get(normalizedEndpoint);
        break;
      case 'POST':
        response = await apiClient.post(normalizedEndpoint, body);
        break;
      case 'PUT':
        response = await apiClient.put(normalizedEndpoint, body);
        break;
      case 'DELETE':
        response = await apiClient.delete(normalizedEndpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`❌ API ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
};

// Export individual methods for convenience
export const api = {
  get: (endpoint: string) => makeRequest('GET', endpoint),
  post: (endpoint: string, data: any) => makeRequest('POST', endpoint, data),
  put: (endpoint: string, data: any) => makeRequest('PUT', endpoint, data),
  delete: (endpoint: string) => makeRequest('DELETE', endpoint),
};

// Also keep the original apiClient for backward compatibility
export default apiClient;