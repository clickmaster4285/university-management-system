import api from './axios';

export type LeaveType =
  | 'Annual'
  | 'Sick'
  | 'Casual'
  | 'Maternity'
  | 'Paternity'
  | 'Unpaid'
  | 'Other';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface StaffLeave {
  _id?: string;
  leaveId?: string;
  staffMember: string | { _id: string; staffId?: string; firstName?: string; lastName?: string };
  staffName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  days?: number;
  rejectionReason?: string;
  approvedDate?: string | null;
}

export interface LeaveBalanceType {
  type: LeaveType;
  quota: number;
  used: number;
  remaining: number;
}

export interface StaffLeaveBalance {
  _id?: string;
  staffMember?: string;
  year: number;
  balances: LeaveBalanceType[];
}

export type StaffAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave' | 'Off-day';

export interface StaffAttendanceRecord {
  _id?: string;
  attendanceId?: string;
  staffMember: string | { _id: string; staffId?: string; firstName?: string; lastName?: string };
  staffName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  isWorkingDay?: boolean;
  isLate?: boolean;
  lateMinutes?: number;
  status: StaffAttendanceStatus;
  remarks?: string;
}

export type RecruitmentStatus =
  | 'Open'
  | 'In Review'
  | 'Interviewing'
  | 'Offer Extended'
  | 'Filled'
  | 'Cancelled';

export type ApplicantStatus =
  | 'Applied'
  | 'Shortlisted'
  | 'Interviewed'
  | 'Offered'
  | 'Rejected'
  | 'Hired';

export interface RecruitmentApplicant {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  status: ApplicantStatus;
  hiredStaffMemberId?: string;
  appliedDate?: string;
}

export interface RecruitmentPosting {
  _id?: string;
  positionId?: string;
  title: string;
  department: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  status: RecruitmentStatus;
  applicants: RecruitmentApplicant[];
  postedDate?: string;
  closingDate?: string | null;
  salaryRange?: { min?: number; max?: number };
}

export type StaffDocumentType =
  | 'cnic'
  | 'contract'
  | 'appointment_letter'
  | 'qualification'
  | 'experience_letter'
  | 'salary_slip'
  | 'other';

export interface StaffDocument {
  _id?: string;
  documentId?: string;
  staffMember?: string;
  staffName?: string;
  documentType: StaffDocumentType;
  documentName: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  relativePath: string;
  notes?: string;
  createdAt?: string;
}

class WorkforceAPI {
  async getLeaveStats() {
    const res = await api.get('/workforce/leaves/stats');
    return res.data?.data as { pending: number; approved: number; onLeaveToday: number };
  }

  async getLeaveBalance(staffMemberId: string, year?: number) {
    const res = await api.get(`/workforce/leaves/balance/${staffMemberId}`, {
      params: year ? { year } : undefined,
    });
    return res.data?.data as StaffLeaveBalance;
  }

  async listLeaves(params?: { staffMemberId?: string; status?: LeaveStatus }) {
    const res = await api.get('/workforce/leaves', { params });
    return (res.data?.data ?? []) as StaffLeave[];
  }

  async createLeave(payload: {
    staffMemberId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const res = await api.post('/workforce/leaves', payload);
    return res.data?.data as StaffLeave;
  }

  async updateLeaveStatus(id: string, payload: { status: LeaveStatus; rejectionReason?: string }) {
    const res = await api.put(`/workforce/leaves/${id}/status`, payload);
    return res.data?.data as StaffLeave;
  }

  async deleteLeave(id: string) {
    const res = await api.delete(`/workforce/leaves/${id}`);
    return res.data;
  }

  async getAttendanceStats(date?: string) {
    const res = await api.get('/workforce/attendance/stats', { params: { date } });
    return res.data?.data as {
      date: string;
      present: number;
      late: number;
      absent: number;
      leave: number;
      offDay: number;
    };
  }

  async listAttendance(params?: { staffMemberId?: string; date?: string; status?: string }) {
    const res = await api.get('/workforce/attendance', { params });
    return (res.data?.data ?? []) as StaffAttendanceRecord[];
  }

  async markAttendance(payload: {
    staffMemberId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    remarks?: string;
  }) {
    const res = await api.post('/workforce/attendance', payload);
    return res.data?.data as StaffAttendanceRecord;
  }

  async bulkMarkAttendance(payload: {
    date: string;
    records?: Array<{
      staffMemberId: string;
      checkInTime?: string;
      checkOutTime?: string;
      status?: StaffAttendanceStatus;
      remarks?: string;
    }>;
    markAbsentForUnmarked?: boolean;
  }) {
    const res = await api.post('/workforce/attendance/bulk', payload);
    return res.data?.data as StaffAttendanceRecord[];
  }

  async getRecruitmentStats() {
    const res = await api.get('/workforce/recruitment/stats');
    return res.data?.data as {
      open: number;
      interviewing: number;
      filled: number;
      totalApplicants: number;
    };
  }

  async listRecruitments(params?: { status?: string; search?: string }) {
    const res = await api.get('/workforce/recruitment', { params });
    return (res.data?.data ?? []) as RecruitmentPosting[];
  }

  async getRecruitment(id: string) {
    const res = await api.get(`/workforce/recruitment/${id}`);
    return res.data?.data as RecruitmentPosting;
  }

  async createRecruitment(payload: Partial<RecruitmentPosting>) {
    const res = await api.post('/workforce/recruitment', payload);
    return res.data?.data as RecruitmentPosting;
  }

  async updateRecruitment(id: string, payload: Partial<RecruitmentPosting>) {
    const res = await api.put(`/workforce/recruitment/${id}`, payload);
    return res.data?.data as RecruitmentPosting;
  }

  async deleteRecruitment(id: string) {
    const res = await api.delete(`/workforce/recruitment/${id}`);
    return res.data;
  }

  async addApplicant(
    recruitmentId: string,
    payload: { name: string; email: string; phone?: string; resume?: string }
  ) {
    const res = await api.post(`/workforce/recruitment/${recruitmentId}/applicants`, payload);
    return res.data?.data as RecruitmentPosting;
  }

  async updateApplicantStatus(recruitmentId: string, applicantId: string, status: ApplicantStatus) {
    const res = await api.put(
      `/workforce/recruitment/${recruitmentId}/applicants/${applicantId}/status`,
      { status }
    );
    return res.data?.data as RecruitmentPosting;
  }

  async hireApplicant(recruitmentId: string, applicantId: string) {
    const res = await api.post(
      `/workforce/recruitment/${recruitmentId}/applicants/${applicantId}/hire`
    );
    return res.data?.data as { recruitment: RecruitmentPosting; staffMember: unknown };
  }

  async listDocuments(staffId: string, documentType?: StaffDocumentType) {
    const res = await api.get(`/staff/${staffId}/documents`, { params: { documentType } });
    return (res.data?.data ?? []) as StaffDocument[];
  }

  async uploadDocument(
    staffId: string,
    payload: { file: File; documentType: StaffDocumentType; documentName: string; notes?: string }
  ) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);
    if (payload.notes) formData.append('notes', payload.notes);

    const res = await api.post(`/staff/${staffId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data as StaffDocument;
  }

  async deleteDocument(staffId: string, documentId: string) {
    const res = await api.delete(`/staff/${staffId}/documents/${documentId}`);
    return res.data;
  }

  getDocumentDownloadUrl(staffId: string, documentId: string) {
    const base = api.defaults.baseURL || '';
    return `${base}/staff/${staffId}/documents/${documentId}/download`;
  }
}

export const workforceAPI = new WorkforceAPI();

export const DOCUMENT_TYPE_LABELS: Record<StaffDocumentType, string> = {
  cnic: 'CNIC',
  contract: 'Contract',
  appointment_letter: 'Appointment Letter',
  qualification: 'Qualification',
  experience_letter: 'Experience Letter',
  salary_slip: 'Salary Slip',
  other: 'Other',
};
