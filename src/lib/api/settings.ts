// src/lib/api/settings.ts
import api from './axios';

export interface Campus {
  _id?: string;
  name: string;
  location: string;
  students: number;
  staff: number;
  isActive: boolean;
}

export interface Preferences {
  darkMode: boolean;
  emailDigests: boolean;
  publicPortal: boolean;
  aiInsights: boolean;
  faceRecognitionAttendance: boolean;
}

export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface Settings {
  _id?: string;
  universityName: string;
  shortCode: string;
  contactEmail: string;
  phone: string;
  currency: string;
  language: string;
  address: string;
  website: string;
  logo: string;
  preferences: Preferences;
  campuses: Campus[];
  integrations: any;
  branding: Branding;
  security: any;
  maintenance: any;
}

export const settingsAPI = {
  // Get all settings
  getAll: async (): Promise<{ success: boolean; data: Settings }> => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: Partial<Settings>): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put('/settings/profile', data);
    return response.data;
  },

  // Update preferences
  updatePreferences: async (data: Partial<Preferences>): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put('/settings/preferences', data);
    return response.data;
  },

  // Add campus
  addCampus: async (data: Partial<Campus>): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.post('/settings/campuses', data);
    return response.data;
  },

  // Update campus
  updateCampus: async (campusId: string, data: Partial<Campus>): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put(`/settings/campuses/${campusId}`, data);
    return response.data;
  },

  // Delete campus
  deleteCampus: async (campusId: string): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.delete(`/settings/campuses/${campusId}`);
    return response.data;
  },

  // Update branding
  updateBranding: async (data: Partial<Branding>): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put('/settings/branding', data);
    return response.data;
  },

  // Update integration
  updateIntegration: async (type: string, config: any): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put(`/settings/integrations/${type}`, { type, config });
    return response.data;
  },

  // Update security
  updateSecurity: async (data: any): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put('/settings/security', data);
    return response.data;
  },

  // Update maintenance
  updateMaintenance: async (data: any): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.put('/settings/maintenance', data);
    return response.data;
  },

  // Reset settings
  reset: async (): Promise<{ success: boolean; data: Settings; message: string }> => {
    const response = await api.post('/settings/reset');
    return response.data;
  }
};