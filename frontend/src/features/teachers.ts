// src/lib/api/teachers.ts
import { apiClient } from './client';

export interface Teacher {
  _id?: string;
  teacherId?: string;
  name: string;
  email?: string;
  phone?: string;
  department: string;
  designation: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  salary?: number;
  status?: string;
  officeHours?: string;
  coursesTeaching?: string[] | any[];
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
  getAll: async () => {
    const result = await apiClient.get('/teachers');
    const payload = result?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },
  getById: (id: string) => apiClient.get(`/teachers/${id}`),
  create: (data: Partial<Teacher>) => apiClient.post('/teachers', data),
  update: (id: string, data: Partial<Teacher>) => apiClient.put(`/teachers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/teachers/${id}`),
  getStats: () => apiClient.get('/teachers/stats'),
  bulkCreate: (data: Partial<Teacher>[]) => apiClient.post('/teachers/bulk', data)
};