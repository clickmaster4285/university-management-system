import api from './axios';

export interface User {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  department?: string;
  designation?: string;
  bio?: string;
  location?: string;
  profileImage?: string;
  role?: string;
  platformRole?: string | null;
  /** Computed from populated platformRole — not stored on user */
  primaryRole?: string;
  moduleAccess?: Record<string, boolean>;
  staffMemberId?: string | null;
  universityId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<{ success: boolean; data: { user: User; token: string }; message?: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: Partial<User> & { password: string }): Promise<{ success: boolean; data: { user: User; token: string }; message?: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: User; message?: string }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; data: User; message?: string }> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
    const response = await api.put('/auth/change-password', payload);
    return response.data;
  }
};