// src/lib/api/teachers.ts
import { apiClient } from './client';

export interface Teacher {
  _id?: string;
  teacherId?: string;
  userId?: string | { _id: string; firstName: string; lastName: string; email: string; role: string; status: string };
  name: string;
  email?: string;
  phone?: string;
  departmentId: string | { _id: string; name: string; code: string };
  designation: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  salary?: number;
  status?: string;
  officeHours?: string;
  qualifications?: Array<{
    degree: string;
    institution: string;
    year: number;
    specialization: string;
  }>;
  joiningDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type for search keys - use keyof Teacher
export type TeacherSearchKey = keyof Teacher;

export const teacherAPI = {
  getAll: async (params?: { departmentId?: string; designation?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.designation) queryParams.append('designation', params.designation);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    const result = await apiClient.get(`/teachers${queryString ? `?${queryString}` : ''}`);
    const payload = result?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },
  getById: (id: string) => apiClient.get(`/teachers/${id}`),
  create: (data: Partial<Teacher>) => apiClient.post('/teachers', data),
  update: (id: string, data: Partial<Teacher>) => apiClient.put(`/teachers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/teachers/${id}`),
  getStats: () => apiClient.get('/teachers/stats')
};