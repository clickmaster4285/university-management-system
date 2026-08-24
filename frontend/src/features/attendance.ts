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
  attendanceStatus: AttendanceStatus; // ✅ Use the union type
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
  // Get all attendance records
  getAll: (params?: {
    date?: string;
    program?: string;
    semester?: number;
    departmentId?: string;
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
    if (params?.status) queryParams.append('status', params.status);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return apiClient.get(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  // Get students for attendance marking
  getStudentsForAttendance: (params: {
    program: string;
    semester: number;
    departmentId: string;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('program', params.program);
    queryParams.append('semester', params.semester.toString());
    queryParams.append('departmentId', params.departmentId);
    return apiClient.get(`/attendance/students?${queryParams.toString()}`);
  },

  // Mark attendance for multiple students
  markAttendance: (data: {
    attendance: Array<{
      studentId: string;
      status: Exclude<AttendanceStatus, 'Not Marked'>;
      remarks?: string;
    }>;
    date?: string;
    program: string;
    semester: number;
    departmentId: string;
    markedBy?: string;
    course?: string;
  }) => apiClient.post('/attendance/mark', data),

  // Get attendance by ID
  getById: (id: string) => apiClient.get(`/attendance/${id}`),

  // Update attendance
  update: (id: string, data: Partial<AttendanceRecord>) => apiClient.put(`/attendance/${id}`, data),

  // Delete attendance
  delete: (id: string) => apiClient.delete(`/attendance/${id}`),

  // Get attendance statistics
  getStats: (params?: {
    program?: string;
    semester?: number;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.program) queryParams.append('program', params.program);
    if (params?.semester) queryParams.append('semester', params.semester.toString());
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    return apiClient.get(`/attendance/stats${queryString ? `?${queryString}` : ''}`);
  },

  // Get student attendance history
  getStudentHistory: (studentId: string, limit?: number) => {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/attendance/student/${studentId}${queryString}`);
  }
};