import api from './axios';

export interface Department {
  _id?: string;
  departmentId?: string;
  campusId?: string | { _id: string; name: string; campusCode: string };
  name: string;
  code: string;
  description?: string;
  headId?: string | { _id: string; name: string; email: string; designation: string };
  facultyId?: string | { _id: string; name: string; code: string };
  status?: 'Active' | 'Inactive';
  location?: string;
  email?: string;
  phone?: string;
  establishedDate?: string;
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
    status: string;
    courseCount: number;
    programCount: number;
    teacherCount: number;
    totalStudents: number;
    totalCredits: number;
  }>;
}

class DepartmentAPI {
  private baseUrl = '/departments';

  async getAll(params?: {
    campusId?: string;
    facultyId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.campusId) queryParams.append('campusId', params.campusId);
      if (params?.facultyId) queryParams.append('facultyId', params.facultyId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
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
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      return {
        success: true,
        data: response.data,
        message: 'Department updated successfully',
      };
    } catch (error) {
      console.error('Error updating department:', error);
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
