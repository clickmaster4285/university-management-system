import api from './axios';
import { type StudentCategory } from './programSemesterFee';

export type { StudentCategory };
export type RegistrationMode = 'package' | 'per_subject' | 'mixed';
export type RegistrationStatus = 'Registered' | 'Paid' | 'Partial' | 'Dropped';

export interface SemesterFeeSnapshot {
  scheduleId: string;
  scheduleCode?: string;
  studentCategory?: StudentCategory;
  subjectLines: Array<{
    subjectId: string;
    code: string;
    name: string;
    credits: number;
    feePerCredit: number;
    feeType: string;
    lineTotal: number;
    isCore?: boolean;
    curriculumType?: string;
    subjectFeeHistoryId?: string | null;
    missingRate?: boolean;
  }>;
  additionalFees: Array<{
    name: string;
    type: 'Fixed' | 'Percentage';
    amount?: number;
    percentage?: number;
    description?: string;
    isOptional?: boolean;
    appliesTo?: string;
  }>;
  discount?: {
    type: 'Percentage' | 'Fixed';
    value: number;
    applicableTo?: string;
    description?: string;
  } | null;
  totalSubjectFee: number;
  totalAdditionalFee: number;
  grossTotal: number;
  discountAmount: number;
  netPayable: number;
  lockedAt: string;
  feePolicy: string;
}

export interface SemesterRegistration {
  _id?: string;
  registrationId?: string;
  studentId: string | { _id: string; name: string; email?: string; program?: string };
  programId: string | { _id: string; name: string; code: string };
  batchId: string | { _id: string; code: string; program?: string };
  academicSessionId: string | { _id: string; name: string; code: string };
  programSemester: number;
  registrationMode: RegistrationMode;
  studentCategory?: StudentCategory;
  semesterFeeSnapshot: SemesterFeeSnapshot;
  enrollmentIds?: string[];
  feeId?: string | null;
  feeId_populated?: { feeId?: string; paymentStatus?: string };
  status: RegistrationStatus;
  registeredAt?: string;
  warnings?: Array<{ code?: string; message: string }>;
  notes?: string;
}

export interface RegistrationPreview {
  student: { _id: string; name: string; program: string; semester?: number };
  program: { _id: string; name: string; code: string };
  batch: { _id: string; code: string; program?: string };
  academicSession: { _id: string; name: string; code: string };
  programSemester: number;
  registrationMode: RegistrationMode;
  studentCategory: StudentCategory;
  schedule: {
    _id: string;
    scheduleId: string;
    status: string;
    netPayable: number;
    subjectCount: number;
  } | null;
  semesterFeeSnapshot: SemesterFeeSnapshot | null;
  existingRegistration: { _id: string; registrationId: string; status: string } | null;
  linkedEnrollmentCount: number;
  warnings: Array<{ code?: string; message: string }>;
}

export interface RegistrationStats {
  total: number;
  byStatus: Record<RegistrationStatus, number>;
  expectedRevenue: number;
}

export interface CreateRegistrationPayload {
  studentId: string;
  programId: string;
  batchId: string;
  academicSessionId: string;
  programSemester: number;
  registrationMode?: RegistrationMode;
  studentCategory?: StudentCategory;
  notes?: string;
}

class SemesterRegistrationAPI {
  async list(params?: {
    studentId?: string;
    programId?: string;
    batchId?: string;
    academicSessionId?: string;
    programSemester?: number;
    status?: RegistrationStatus;
    registrationMode?: RegistrationMode;
  }) {
    const res = await api.get('/semester-registrations', { params });
    return (res.data?.data ?? []) as SemesterRegistration[];
  }

  async getById(id: string) {
    const res = await api.get(`/semester-registrations/${id}`);
    return res.data?.data as SemesterRegistration;
  }

  async listByStudent(studentId: string) {
    const res = await api.get(`/students/${studentId}/semester-registrations`);
    return (res.data?.data ?? []) as SemesterRegistration[];
  }

  async preview(payload: CreateRegistrationPayload) {
    const res = await api.post('/semester-registrations/preview', payload);
    return res.data?.data as RegistrationPreview;
  }

  async create(payload: CreateRegistrationPayload) {
    const res = await api.post('/semester-registrations', payload);
    return {
      data: res.data?.data as SemesterRegistration,
      warnings: (res.data?.warnings ?? []) as Array<{ code?: string; message: string }>,
    };
  }

  async drop(id: string) {
    const res = await api.patch(`/semester-registrations/${id}/drop`);
    return res.data?.data as SemesterRegistration;
  }

  async generateChallan(id: string, payload?: { dueDays?: number; dueDate?: string; notes?: string }) {
    const res = await api.post(`/semester-registrations/${id}/generate-challan`, payload || {});
    return res.data?.data as {
      challan: { _id: string; feeId: string; amount: number; paymentStatus: string };
      registration: SemesterRegistration;
    };
  }

  async getStats(params?: {
    academicSessionId?: string;
    programId?: string;
    batchId?: string;
  }) {
    const res = await api.get('/semester-registrations/stats', { params });
    return res.data?.data as RegistrationStats;
  }
}

export const semesterRegistrationAPI = new SemesterRegistrationAPI();
