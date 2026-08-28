import api from './axios';

export interface Faculty {
  _id?: string;
  facultyId?: string;
  campusId?: string | { _id: string; name: string; campusCode: string };
  name: string;
  code: string;
  description?: string;
  headId?: string | { _id: string; name: string; email: string; designation: string };
  email?: string;
  phone?: string;
  establishedDate?: string;
  status?: 'Active' | 'Inactive';
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacultyStats {
  total: number;
  active: number;
  inactive: number;
  faculties: Array<{
    _id: string;
    name: string;
    code: string;
    status: string;
    departmentCount: number;
  }>;
}

class FacultyAPI {
  private baseUrl = '/faculties';

  async getAll(params?: { campusId?: string; status?: string; search?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.campusId) queryParams.append('campusId', params.campusId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching faculties:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty stats:', error);
      throw error;
    }
  }

  async create(data: Partial<Faculty>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating faculty:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Faculty>) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  }
}

export const facultyAPI = new FacultyAPI();
export default facultyAPI;
