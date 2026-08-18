// src/lib/api/academicSessions.ts
import api from './axios';

export interface AcademicSession {
  _id?: string;
  sessionId?: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Upcoming' | 'Completed';
  isCurrent: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicSessionStats {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  inactive: number;
  currentSession?: AcademicSession;
}

class AcademicSessionAPI {
  private baseUrl = '/academic-sessions';

  async getAll(params?: { status?: string; isCurrent?: boolean }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.isCurrent !== undefined) {
        queryParams.append('isCurrent', String(params.isCurrent));
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic sessions:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic session:', error);
      throw error;
    }
  }

  async getCurrent() {
    try {
      const response = await api.get(`${this.baseUrl}/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current academic session:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic session stats:', error);
      throw error;
    }
  }

  async create(data: Partial<AcademicSession>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating academic session:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<AcademicSession>) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating academic session:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting academic session:', error);
      throw error;
    }
  }

  async setCurrent(id: string) {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/set-current`);
      return response.data;
    } catch (error) {
      console.error('Error setting current academic session:', error);
      throw error;
    }
  }
}

export const academicSessionAPI = new AcademicSessionAPI();
export default academicSessionAPI;