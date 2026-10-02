// src/lib/api/attendance.ts
import { apiClient } from './client';

// ✅ Define the status union type
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave' | 'Not Marked';

export interface AttendanceRecord {
  _id?: string;
  attendanceId?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  offeringId?: string | null;
  subjectId?: string | null;
  programId?: string | null;
  batchId?: string | null;
  academicSessionId?: string | null;
  courseCode?: string;
  program: string;
  semester: number;
  department: string;
  departmentId?: string;
  date: string;
  status: Exclude<AttendanceStatus, 'Not Marked'>;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  markedBy?: string;
  course?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAttendance {
  _id: string;
  name: string;
  email: string;
  program: string;
  semester: number;
  department: string;
  attendanceStatus: AttendanceStatus;
  attendanceId: string | null;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  notMarked: number;
  date: string;
}

export const attendanceAPI = {
  getAll: (params?: {
    date?: string;
    program?: string;
    semester?: number;
    departmentId?: string;
    offeringId?: string;
    batchId?: string;
    academicSessionId?: string;
    status?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.program) queryParams.append('program', params.program);
    if (params?.semester) queryParams.append('semester', params.semester.toString());
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.offeringId) queryParams.append('offeringId', params.offeringId);
    if (params?.batchId) queryParams.append('batchId', params.batchId);
    if (params?.academicSessionId) queryParams.append('academicSessionId', params.academicSessionId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return apiClient.get(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getStudentsForAttendance: (params: {
    offeringId: string;
    date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('offeringId', params.offeringId);
    if (params.date) queryParams.append('date', params.date);
    return apiClient.get(`/attendance/students?${queryParams.toString()}`);
  },

  markAttendance: (data: {
    attendance: Array<{
      studentId: string;
      status: Exclude<AttendanceStatus, 'Not Marked'>;
      remarks?: string;
    }>;
    date?: string;
    offeringId: string;
    markedBy?: string;
  }) => apiClient.post('/attendance/mark', data),

  getById: (id: string) => apiClient.get(`/attendance/${id}`),

  update: (id: string, data: Partial<AttendanceRecord>) => apiClient.put(`/attendance/${id}`, data),

  delete: (id: string) => apiClient.delete(`/attendance/${id}`),

  getStats: (params?: {
    program?: string;
    semester?: number;
    departmentId?: string;
    offeringId?: string;
    batchId?: string;
    academicSessionId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.program) queryParams.append('program', params.program);
    if (params?.semester) queryParams.append('semester', params.semester.toString());
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.offeringId) queryParams.append('offeringId', params.offeringId);
    if (params?.batchId) queryParams.append('batchId', params.batchId);
    if (params?.academicSessionId) queryParams.append('academicSessionId', params.academicSessionId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    return apiClient.get(`/attendance/stats${queryString ? `?${queryString}` : ''}`);
  },

  getStudentHistory: (studentId: string, limit?: number) => {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/attendance/student/${studentId}${queryString}`);
  }
};
