import { apiClient } from './client';

export interface Department {
  _id?: string;
  departmentId?: string;
  name: string;
  code: string;
  description?: string;
  head?: string;
  facultyCount?: number;
  studentCount?: number;
  status?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const departmentAPI = {
  getAll: () => apiClient.get('/departments'),
  getById: (id: string) => apiClient.get(`/departments/${id}`),
  create: (data: Partial<Department>) => apiClient.post('/departments', data),
  update: (id: string, data: Partial<Department>) => apiClient.put(`/departments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/departments/${id}`),
  getStats: () => apiClient.get('/departments/stats')
};