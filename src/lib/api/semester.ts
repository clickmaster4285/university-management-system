// src/lib/api/semesters.ts
import api from './axios';

export interface Semester {
  _id?: string;
  semesterId?: string;
  academicSessionId: string;
  academicSessionName?: string;
  name: string;
  number: number;
  type: 'Fall' | 'Spring' | 'Summer' | 'Winter';
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  status: 'Upcoming' | 'Active' | 'Completed' | 'Inactive';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SemesterStats {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  bySession: Array<{
    sessionName: string;
    count: number;
  }>;
}

class SemesterAPI {
  private baseUrl = '/semesters';

  async getAll(params?: { academicSessionId?: string; status?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.academicSessionId) {
        queryParams.append('academicSessionId', params.academicSessionId);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching semesters:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching semester:', error);
      throw error;
    }
  }

  async getBySession(sessionId: string) {
    try {
      const response = await api.get(`${this.baseUrl}/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching semesters by session:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching semester stats:', error);
      throw error;
    }
  }

  async create(data: Partial<Semester>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating semester:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Semester>) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating semester:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting semester:', error);
      throw error;
    }
  }
}

export const semesterAPI = new SemesterAPI();
export default semesterAPI;