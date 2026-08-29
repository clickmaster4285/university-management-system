import api from './axios';

export interface Subject {
  _id?: string;
  subjectId?: string;
  code: string;
  name: string;
  departmentId: string | { _id: string; name: string; code: string };
  credits: number;
  description?: string;
  prerequisiteSubjectIds?: Array<string | { _id: string; code: string; name: string }>;
  status?: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectStats {
  total: number;
  active: number;
  inactive: number;
}

class SubjectAPI {
  private baseUrl = '/subjects';

  async getAll(params?: {
    departmentId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get(url);
    return response.data;
  }

  async getById(id: string) {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getStats() {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  async create(data: Partial<Subject>) {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: Partial<Subject>) {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const subjectAPI = new SubjectAPI();
export default subjectAPI;
