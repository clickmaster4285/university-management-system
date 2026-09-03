// src/lib/api/batches.ts
import api from './axios';

export interface Batch {
  _id?: string;
  batchId?: string;
  year: number;
  code: string;
  department: string;
  departmentId?: string | { _id?: string; name?: string; code?: string };
  program: string;
  programId?: string | { _id?: string };
  admissionSession: string;
  admissionSessionId?: string | { _id?: string; sessionId?: string; name?: string };
  admissionSemester: string;
  expectedGraduation: number;
  status: 'Active' | 'Inactive' | 'Upcoming' | 'Completed';
  description?: string;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchStats {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  byDepartment: Array<{
    department: string;
    count: number;
  }>;
  byProgram: Array<{
    program: string;
    count: number;
  }>;
}

class BatchAPI {
  private baseUrl = '/batches';

  async getAll(params?: { departmentId?: string; program?: string; status?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.departmentId) {
        queryParams.append('departmentId', params.departmentId);
      }
      if (params?.program) {
        queryParams.append('program', params.program);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch stats:', error);
      throw error;
    }
  }

  async create(data: Partial<Batch>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Batch>) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }
}

export const batchAPI = new BatchAPI();
export default batchAPI;