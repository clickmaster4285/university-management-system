// src/lib/api/departments.ts
import api from './axios';

export interface Department {
  _id?: string;
  departmentId?: string;
  campusId?: string | { _id: string; name: string; campusCode: string };
  name: string;
  code: string;
  description?: string;
  headId?: string | { _id: string; name: string; email: string; designation: string };
  facultyCount?: number;
  studentCount?: number;
  status?: 'Active' | 'Inactive';
  location?: string;
  email?: string;
  phone?: string;
  establishedDate?: string;
  faculty?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  departments: Array<{
    name: string;
    code: string;
    isActive: boolean;
    courseCount: number;
    totalStudents: number;
    totalCredits: number;
  }>;
}

class DepartmentAPI {
  private baseUrl = '/departments';

  async getAll(params?: { campusId?: string; isActive?: boolean }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.campusId) queryParams.append('campusId', params.campusId);
      if (params?.isActive !== undefined) {
        queryParams.append('isActive', String(params.isActive));
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching department stats:', error);
      throw error;
    }
  }

  async create(data: Partial<Department>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Department>) {
    try {
      
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      
      
      // Ensure we return the data in a consistent format
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      
      // If the API doesn't return a success flag, wrap it
      return {
        success: true,
        data: response.data,
        message: 'Department updated successfully'
      };
    } catch (error: any) {
      console.error('❌ Error updating department:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }
}

export const departmentAPI = new DepartmentAPI();
export default departmentAPI;