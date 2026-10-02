import { apiClient } from './client';
import type { RefSummary } from './studentApplications';

export interface StudentGuardian {
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
}

export interface StudentAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface StudentPreviousEducation {
  institution?: string;
  degree?: string;
  grade?: string;
  yearOfCompletion?: number | null;
  percentage?: number | null;
}

export interface Student {
  _id?: string;
  studentId?: string;
  admissionId?: string | { _id?: string; admissionId: string; status: string };
  admissionNumber?: string;
  userId?: string | { _id?: string; email?: string; role?: string; status?: string };
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  cnic?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: string;
  nationality?: string;
  religion?: string;
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
  guardian?: StudentGuardian;
  address?: StudentAddress;
  previousEducation?: StudentPreviousEducation[];
  createdAt?: string;
  updatedAt?: string;
}

export type PortalLoginCredentials = {
  email: string;
  temporaryPassword: string | null;
};

const refId = (value: unknown) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id?: string })._id || '');
  }
  return String(value);
};

/** Strip populated refs / virtuals before PUT so mongoose gets ObjectIds. */
export const serializeStudentUpdate = (student: Partial<Student>) => ({
  firstName: student.firstName,
  lastName: student.lastName,
  email: student.email,
  phone: student.phone,
  cnic: student.cnic,
  fatherName: student.fatherName || student.guardian?.fatherName,
  motherName: student.motherName || student.guardian?.motherName,
  dateOfBirth: student.dateOfBirth || null,
  gender: student.gender || '',
  nationality: student.nationality,
  religion: student.religion,
  city: student.city || student.address?.city,
  currentSemester: student.currentSemester ?? student.semester,
  semester: student.semester ?? student.currentSemester,
  status: student.status,
  programId: refId(student.programId),
  departmentId: refId(student.departmentId),
  campusId: refId(student.campusId),
  batchId: refId(student.batchId),
  guardian: student.guardian,
  address: student.address,
});

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

  update: async (id: string, data: Partial<Student>) => {
    const result = await apiClient.put(`/students/${id}`, serializeStudentUpdate(data));
    return result.data as { success: boolean; data: Student };
  },

  delete: (id: string) => apiClient.delete(`/students/${id}`),

  create: async (data: Record<string, unknown>) => {
    const result = await apiClient.post('/students', data);
    return result.data as {
      success: boolean;
      data: Student;
      portalLogin?: PortalLoginCredentials | null;
      message?: string;
    };
  },

  enablePortalLogin: async (id: string, password?: string) => {
    const result = await apiClient.post(`/students/${id}/portal-login`, password ? { password } : {});
    return result.data as {
      success: boolean;
      data: Student;
      portalLogin?: PortalLoginCredentials | null;
      message?: string;
    };
  },

  getStats: async () => {
    const result = await apiClient.get('/students/stats');
    return result.data?.data || result.data;
  },
};
