import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached to request:', config.url);
    } else {
      console.log('⚠️ No token found for request:', config.url);
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
    console.log('✅ Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.config?.url, error.response?.status);
    
    // Handle 401 Unauthorized - but don't redirect for assignment endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Only redirect to login if it's not an assignment endpoint
      if (!url.includes('/assignments')) {
        console.log('🔐 Token expired or invalid, redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        console.log('⚠️ Auth error on assignments endpoint - trying without auth');
        // Don't redirect, just return the error
      }
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - please check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

export default api;