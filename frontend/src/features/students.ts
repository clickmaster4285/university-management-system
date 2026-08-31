import { apiClient } from './client';
import type { RefSummary } from './studentApplications';

export interface Student {
  _id?: string;
  studentId?: string;
  admissionId?: string | { admissionId: string; status: string };
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  cnic?: string;
  email?: string;
  phone?: string;
  programId?: string | RefSummary;
  departmentId?: string | RefSummary;
  campusId?: string | RefSummary;
  batchId?: string | RefSummary;
  program?: string;
  department?: string;
  campus?: string;
  semester?: number;
  currentSemester?: number;
  gpa?: number;
  cgpa?: number;
  attendance?: number;
  fee?: string;
  city?: string;
  status?: string;
  enrollmentDate?: string;
  photo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const studentAPI = {
  getAll: async (params?: Record<string, string | number>) => {
    const result = await apiClient.get('/students', { params });
    const payload = result?.data;
    if (Array.isArray(payload?.data)) return payload.data as Student[];
    if (Array.isArray(payload)) return payload as Student[];
    return [];
  },

  getById: async (id: string) => {
    const result = await apiClient.get(`/students/${id}`);
    return (result.data?.data || result.data) as Student;
  },

  update: (id: string, data: Partial<Student>) => apiClient.put(`/students/${id}`, data),
  delete: (id: string) => apiClient.delete(`/students/${id}`),

  getStats: async () => {
    const result = await apiClient.get('/students/stats');
    return result.data?.data || result.data;
  },
};
