// src/lib/api/client.ts
// ✅ Use environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4005/api';

console.log('🔗 API Base URL:', API_BASE); // Check this in browser console

export const apiClient = {
  get: async (endpoint: string) => {
    const url = `${API_BASE}${endpoint}`;
    console.log('📤 GET Request:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // ✅ Add this to send cookies if needed
        credentials: 'include',
      });
      
      console.log('📥 Response Status:', response.status);
      console.log('📥 Response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Response Data:', data);
      return data;
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      throw error;
    }
  },
  
  post: async (endpoint: string, data: any) => {
    const url = `${API_BASE}${endpoint}`;
    console.log('📤 POST Request:', url, data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Network response was not ok');
    }
    return response.json();
  },
  
  put: async (endpoint: string, data: any) => {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Network response was not ok');
    }
    return response.json();
  },
  
  delete: async (endpoint: string) => {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Network response was not ok');
    }
    return response.json();
  }
};