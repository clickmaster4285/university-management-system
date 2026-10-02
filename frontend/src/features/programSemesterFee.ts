import api from './axios';

export type ScheduleStatus = 'Draft' | 'Active' | 'Archived';
export type StudentCategory = 'Regular' | 'Self-Finance' | 'Scholarship' | 'International';

export interface SubjectFeeLine {
  _id?: string;
  subjectId: string;
  code: string;
  name: string;
  credits: number;
  feePerCredit: number;
  feeType: string;
  lineTotal: number;
  isCore: boolean;
  curriculumType: string;
  subjectFeeHistoryId?: string | null;
  missingRate?: boolean;
}

export interface AdditionalFeeLine {
  _id?: string;
  name: string;
  type: 'Fixed' | 'Percentage';
  amount?: number;
  percentage?: number;
  description?: string;
  isOptional?: boolean;
  appliesTo?: 'All' | 'Category' | 'Batch';
}

export interface ProgramSemesterFeeSchedule {
  _id?: string;
  scheduleId?: string;
  programId: string | { _id: string; name: string; code: string };
  semester: number;
  academicSessionId: string | { _id: string; name: string; code: string };
  studentCategory?: StudentCategory;
  status: ScheduleStatus;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  subjectLines: SubjectFeeLine[];
  additionalFees: AdditionalFeeLine[];
  discount?: {
    type: 'Percentage' | 'Fixed';
    value: number;
    applicableTo?: 'Tuition Fee' | 'Total Fee';
    description?: string;
  } | null;
  totalSubjectFee?: number;
  totalAdditionalFee?: number;
  grossTotal?: number;
  discountAmount?: number;
  netPayable?: number;
  warnings?: Array<{ subjectId?: string; code?: string; message: string }>;
  notes?: string;
  generatedAt?: string;
  activatedAt?: string;
  livePreview?: {
    subjectLines: SubjectFeeLine[];
    warnings?: Array<{ subjectId?: string; code?: string; message: string }>;
    totalSubjectFee: number;
    totalAdditionalFee: number;
    grossTotal: number;
    discountAmount: number;
    netPayable: number;
    ratesStale: boolean;
    resolvedAt?: string;
  };
}

export interface SemesterFeeStatsRow {
  semester: number;
  hasSchedule: boolean;
  status: ScheduleStatus | null;
  subjectCount: number;
  netPayable: number | null;
}

class ProgramSemesterFeeAPI {
  private baseUrl = '/program-semester-fees';

  async getAll(params?: {
    programId?: string;
    academicSessionId?: string;
    semester?: number;
    status?: ScheduleStatus;
    studentCategory?: StudentCategory;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const url = query.toString() ? `${this.baseUrl}?${query}` : this.baseUrl;
    const response = await api.get(url);
    return response.data;
  }

  async getById(id: string, options?: { live?: boolean }) {
    const query = options?.live ? '?live=1' : '';
    const response = await api.get(`${this.baseUrl}/${id}${query}`);
    return response.data;
  }

  async listForProgram(programId: string, params?: {
    academicSessionId?: string;
    semester?: number;
    status?: ScheduleStatus;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const url = query.toString()
      ? `/programs/${programId}/semester-fees?${query}`
      : `/programs/${programId}/semester-fees`;
    const response = await api.get(url);
    return response.data;
  }

  async getStats(programId: string, academicSessionId?: string) {
    const query = academicSessionId ? `?academicSessionId=${academicSessionId}` : '';
    const response = await api.get(`/programs/${programId}/semester-fees/stats${query}`);
    return response.data;
  }

  async generate(programId: string, payload: {
    academicSessionId: string;
    semester?: number;
    studentCategory?: StudentCategory;
    effectiveFrom?: string;
    additionalFees?: AdditionalFeeLine[];
    notes?: string;
    atDate?: string;
  }) {
    const response = await api.post(`/programs/${programId}/semester-fees/generate`, payload);
    return response.data;
  }

  async update(id: string, payload: {
    additionalFees?: AdditionalFeeLine[];
    discount?: ProgramSemesterFeeSchedule['discount'];
    notes?: string;
    effectiveFrom?: string;
    effectiveTo?: string | null;
  }) {
    const response = await api.put(`${this.baseUrl}/${id}`, payload);
    return response.data;
  }

  async refreshRates(id: string) {
    const response = await api.patch(`${this.baseUrl}/${id}/refresh-rates`, {});
    return response.data;
  }

  async activate(id: string) {
    const response = await api.patch(`${this.baseUrl}/${id}/activate`);
    return response.data;
  }

  async archive(id: string) {
    const response = await api.patch(`${this.baseUrl}/${id}/archive`);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const programSemesterFeeAPI = new ProgramSemesterFeeAPI();
