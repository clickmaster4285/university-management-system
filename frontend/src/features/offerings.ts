import api from './axios';

export type OfferingStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';
export type EnrollmentStatus = 'Enrolled' | 'Dropped' | 'Completed' | 'Withdrawn';

export interface OfferingSchedule {
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  building?: string;
}

export interface FeeSnapshot {
  subjectFeeHistoryId: string;
  feePolicy: string;
  credits: number;
  feePerCredit: number;
  totalFee: number;
  feeType: string;
  academicSessionId: string;
  lockedAt: string;
}

export interface CourseOffering {
  _id?: string;
  offeringId?: string;
  subjectId: string | { _id: string; subjectId?: string; code: string; name: string; credits: number };
  programId: string | { _id: string; programId?: string; code: string; name: string };
  batchId: string | { _id: string; batchId?: string; code: string; year: number; program?: string };
  academicSessionId: string | { _id: string; sessionId?: string; name: string; year?: number; status?: string };
  semester: number;
  instructorId?: string | { _id: string; teacherId?: string; name: string; email?: string } | null;
  schedule?: OfferingSchedule;
  capacity: number;
  enrolledStudents: number;
  status: OfferingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  _id: string;
  studentId: string | { _id: string; studentId?: string; name: string; email?: string; program?: string; department?: string; status?: string };
  offeringId: string | { _id: string; offeringId?: string; semester?: number; status?: string };
  enrolledAt: string;
  status: EnrollmentStatus;
  feeSnapshot: FeeSnapshot;
  feePolicyApplied: string;
}

export interface OfferingStats {
  total: number;
  active: number;
  draft: number;
  completed: number;
  totalEnrollments: number;
}

export interface CreateOfferingPayload {
  subjectId: string;
  programId: string;
  batchId: string;
  academicSessionId: string;
  semester: number;
  instructorId?: string | null;
  schedule?: OfferingSchedule;
  capacity?: number;
  status?: OfferingStatus;
}

class OfferingAPI {
  private baseUrl = '/offerings';

  async getAll(params?: {
    programId?: string;
    batchId?: string;
    academicSessionId?: string;
    subjectId?: string;
    status?: string;
    semester?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.programId) queryParams.append('programId', params.programId);
    if (params?.batchId) queryParams.append('batchId', params.batchId);
    if (params?.academicSessionId) queryParams.append('academicSessionId', params.academicSessionId);
    if (params?.subjectId) queryParams.append('subjectId', params.subjectId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.semester) queryParams.append('semester', String(params.semester));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get(url);
    return response.data;
  }

  async getStats() {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  async getById(id: string) {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(payload: CreateOfferingPayload) {
    const response = await api.post(this.baseUrl, payload);
    return response.data;
  }

  async update(id: string, payload: Partial<CreateOfferingPayload>) {
    const response = await api.put(`${this.baseUrl}/${id}`, payload);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getEnrollments(offeringId: string) {
    const response = await api.get(`${this.baseUrl}/${offeringId}/enrollments`);
    return response.data;
  }

  async enrollStudent(offeringId: string, studentId: string) {
    const response = await api.post(`${this.baseUrl}/${offeringId}/enroll`, { studentId });
    return response.data;
  }

  async dropStudent(offeringId: string, studentId: string) {
    const response = await api.delete(`${this.baseUrl}/${offeringId}/enroll/${studentId}`);
    return response.data;
  }
}

export const offeringAPI = new OfferingAPI();
export default offeringAPI;
