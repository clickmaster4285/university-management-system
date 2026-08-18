// src/lib/api/settings.ts
import api from './axios';

export interface Campus {
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
  campuses: Campus[];
  integrations: Record<string, any>;
  branding: Branding;
  security: Security;
  maintenance: Maintenance;
  lastUpdatedBy?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Type for adding a new campus (without auto-generated fields)
export type AddCampusData = Omit<Campus, '_id' | 'isActive' | 'createdAt'>;

// Type for updating a campus (all fields optional)
export type UpdateCampusData = Partial<Omit<Campus, '_id' | 'createdAt'>>;

export const settingsAPI = {
  /**
   * Get all settings
   * @returns {Promise<{ success: boolean; data: Settings }>}
   */
  getAll: async (): Promise<{ success: boolean; data: Settings }> => {
    try {
      console.log('📤 GET /settings - Fetching all settings');
      const response = await api.get('/settings');
      console.log('📥 GET /settings - Response received:', response.data);
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
      console.log('📤 PUT /settings/profile - Updating profile:', data);
      const response = await api.put('/settings/profile', data);
      console.log('📥 PUT /settings/profile - Response:', response.data);
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
      console.log('📤 PUT /settings/preferences - Updating preferences:', data);
      const response = await api.put('/settings/preferences', data);
      console.log('📥 PUT /settings/preferences - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  },

  /**
   * Add a new campus
   * @param {AddCampusData} data - Campus data (name, location, students, staff)
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  addCampus: async (data: AddCampusData): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        throw new Error('Campus name is required');
      }

      // Ensure proper data types
      const payload = {
        name: data.name.trim(),
        location: data.location?.trim() || '',
        students: Number(data.students) || 0,
        staff: Number(data.staff) || 0
      };

      console.log('📤 POST /settings/campuses - Adding campus:', payload);
      const response = await api.post('/settings/campuses', payload);
      console.log('📥 POST /settings/campuses - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding campus:', error);
      throw error;
    }
  },

  /**
   * Update an existing campus
   * @param {string} campusId - Campus ID to update
   * @param {UpdateCampusData} data - Campus data to update
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  updateCampus: async (campusId: string, data: UpdateCampusData): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      if (!campusId) {
        throw new Error('Campus ID is required');
      }

      // Prepare the payload
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.location !== undefined) payload.location = data.location.trim();
      if (data.students !== undefined) payload.students = Number(data.students);
      if (data.staff !== undefined) payload.staff = Number(data.staff);
      if (data.isActive !== undefined) payload.isActive = data.isActive;

      console.log(`📤 PUT /settings/campuses/${campusId} - Updating campus:`, payload);
      const response = await api.put(`/settings/campuses/${campusId}`, payload);
      console.log(`📥 PUT /settings/campuses/${campusId} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating campus ${campusId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a campus
   * @param {string} campusId - Campus ID to delete
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  deleteCampus: async (campusId: string): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      if (!campusId) {
        throw new Error('Campus ID is required');
      }

      console.log(`📤 DELETE /settings/campuses/${campusId} - Deleting campus`);
      const response = await api.delete(`/settings/campuses/${campusId}`);
      console.log(`📥 DELETE /settings/campuses/${campusId} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting campus ${campusId}:`, error);
      throw error;
    }
  },

  /**
   * Get a single campus by ID
   * @param {string} campusId - Campus ID to fetch
   * @returns {Promise<{ success: boolean; data: Campus }>}
   */
  getCampusById: async (campusId: string): Promise<{ success: boolean; data: Campus }> => {
    try {
      if (!campusId) {
        throw new Error('Campus ID is required');
      }

      console.log(`📤 GET /settings/campuses/${campusId} - Fetching campus`);
      const response = await api.get(`/settings/campuses/${campusId}`);
      console.log(`📥 GET /settings/campuses/${campusId} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching campus ${campusId}:`, error);
      throw error;
    }
  },

  /**
   * Toggle campus active status
   * @param {string} campusId - Campus ID to toggle
   * @returns {Promise<{ success: boolean; data: Settings; message: string }>}
   */
  toggleCampusStatus: async (campusId: string): Promise<{ success: boolean; data: Settings; message: string }> => {
    try {
      if (!campusId) {
        throw new Error('Campus ID is required');
      }

      console.log(`📤 PATCH /settings/campuses/${campusId}/toggle - Toggling campus status`);
      const response = await api.patch(`/settings/campuses/${campusId}/toggle`);
      console.log(`📥 PATCH /settings/campuses/${campusId}/toggle - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error toggling campus ${campusId}:`, error);
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
      console.log('📤 PUT /settings/branding - Updating branding:', data);
      const response = await api.put('/settings/branding', data);
      console.log('📥 PUT /settings/branding - Response:', response.data);
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

      console.log(`📤 PUT /settings/integrations - Updating integration ${type}:`, config);
      const response = await api.put('/settings/integrations', { type, config });
      console.log(`📥 PUT /settings/integrations - Response:`, response.data);
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
      console.log('📤 PUT /settings/security - Updating security:', data);
      const response = await api.put('/settings/security', data);
      console.log('📥 PUT /settings/security - Response:', response.data);
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
      console.log('📤 PUT /settings/maintenance - Updating maintenance:', data);
      const response = await api.put('/settings/maintenance', data);
      console.log('📥 PUT /settings/maintenance - Response:', response.data);
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
      console.log('📤 POST /settings/reset - Resetting settings to default');
      const response = await api.post('/settings/reset');
      console.log('📥 POST /settings/reset - Response:', response.data);
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
  addCampus,
  updateCampus,
  deleteCampus,
  getCampusById,
  toggleCampusStatus,
  updateBranding,
  updateIntegration,
  updateSecurity,
  updateMaintenance,
  reset
} = settingsAPI;

// Default export
export default settingsAPI;