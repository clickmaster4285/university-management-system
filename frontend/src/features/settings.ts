// src/lib/api/settings.ts
import api from './axios';

export interface SettingsCampus {
  _id?: string;
  name: string;
  location: string;
  students: number;
  staff: number;
  isActive: boolean;
  createdAt?: string;
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

export interface Security {
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface Maintenance {
  isEnabled: boolean;
  message: string;
  scheduledAt?: string;
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
  campuses: SettingsCampus[];
  integrations: Record<string, any>;
  branding: Branding;
  security: Security;
  maintenance: Maintenance;
  lastUpdatedBy?: string;
  updatedAt?: string;
  createdAt?: string;
}

export const settingsAPI = {
  /**
   * Get all settings
   * @returns {Promise<{ success: boolean; data: Settings }>}
   */
  getAll: async (): Promise<{ success: boolean; data: Settings }> => {
    try {
      const response = await api.get('/settings');
     return response.data;
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update university profile
   * @param {Partial<Settings>} data - Profile data to update
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updateProfile: async (data: Partial<Settings>): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      const response = await api.put('/settings/profile', data);
     return response.data;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Update preferences
   * @param {Partial<Preferences>} data - Preferences data to update
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updatePreferences: async (data: Partial<Preferences>): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      const response = await api.put('/settings/preferences', data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  },

  /**
   * Update branding settings
   * @param {Partial<Branding>} data - Branding data to update
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updateBranding: async (data: Partial<Branding>): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      const response = await api.put('/settings/branding', data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating branding:', error);
      throw error;
    }
  },

  /**
   * Update integration settings
   * @param {string} type - Integration type (e.g., 'slack', 'zoom')
   * @param {any} config - Integration configuration
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updateIntegration: async (type: string, config: any): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      if (!type) {
        throw new Error('Integration type is required');
      }

      const response = await api.put('/settings/integrations', { type, config });
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Update security settings
   * @param {Partial<Security>} data - Security data to update
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updateSecurity: async (data: Partial<Security>): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      const response = await api.put('/settings/security', data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating security:', error);
      throw error;
    }
  },

  /**
   * Update maintenance settings
   * @param {Partial<Maintenance>} data - Maintenance data to update
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updateMaintenance: async (data: Partial<Maintenance>): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      const response = await api.put('/settings/maintenance', data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating maintenance:', error);
      throw error;
    }
  },

  /**
   * Reset all settings to default
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  reset: async (): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      const response = await api.post('/settings/reset');
      return response.data;
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      throw error;
    }
  }
};

// Export individual functions for easier imports
export const {
  getAll,
  updateProfile,
  updatePreferences,
  updateBranding,
  updateIntegration,
  updateSecurity,
  updateMaintenance,
  reset
} = settingsAPI;

// Default export
export default settingsAPI;