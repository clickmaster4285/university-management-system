// src/lib/api/students.ts
import { apiClient } from './client';

export interface Student {
  _id?: string;
  studentId?: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  cnic?: string;
  email?: string;
  phone?: string;
  program: string;
  department: string;
  semester?: number;
  gpa?: number;
  cgpa?: number;
  attendance?: number;
  fee?: string;
  city?: string;
  campus?: string;
  status?: string;
  coursesEnrolled?: string[] | any[];
  enrollmentDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const studentAPI = {
  getAll: async () => {
    console.log('📤 Fetching students from API...'); // Debug
    const result = await apiClient.get('/students');
    console.log('📥 Students response:', result); // Debug
    return result;
  },
  
  getById: (id: string) => apiClient.get(`/students/${id}`),
  create: (data: Partial<Student>) => apiClient.post('/students', data),
  update: (id: string, data: Partial<Student>) => apiClient.put(`/students/${id}`, data),
  delete: (id: string) => apiClient.delete(`/students/${id}`),
  getStats: () => apiClient.get('/students/stats'),
  bulkCreate: (data: Partial<Student>[]) => apiClient.post('/students/bulk', data)
};