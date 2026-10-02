import api from './axios';

export interface Program {
  _id?: string;
  programId?: string;
  name: string;
  code: string;
  departmentId: string | { _id: string; name: string; code: string };
  degreeLevel: 'BS' | 'MS' | 'PhD' | 'BBA' | 'MBA' | 'LLB' | 'Other';
  duration: number;
  totalCredits?: number;
  description?: string;
  status?: 'Active' | 'Inactive';
  /** ISO date — public apply opens from this day when set */
  admissionOpensAt?: string | null;
  /** ISO date — public apply closes on this day when set */
  admissionClosesAt?: string | null;
  admissionFee?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Staff/public helper: Active + within optional date window. No dates ⇒ not open. */
export function isProgramAdmissionOpen(
  program: Pick<Program, 'status' | 'admissionOpensAt' | 'admissionClosesAt'>,
  now = new Date()
): boolean {
  if (program.status && program.status !== 'Active') return false;
  const opens = program.admissionOpensAt ? new Date(program.admissionOpensAt) : null;
  const closes = program.admissionClosesAt ? new Date(program.admissionClosesAt) : null;
  if (!opens && !closes) return false;
  if (opens && Number.isNaN(opens.getTime())) return false;
  if (closes && Number.isNaN(closes.getTime())) return false;
  if (opens && now < opens) return false;
  if (closes) {
    const end = new Date(closes);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

export function formatAdmissionWindowLabel(
  program: Pick<Program, 'status' | 'admissionOpensAt' | 'admissionClosesAt'>
): { label: string; open: boolean } {
  const open = isProgramAdmissionOpen(program);
  if (program.status === 'Inactive') return { label: 'Inactive', open: false };
  if (!program.admissionOpensAt && !program.admissionClosesAt) {
    return { label: 'No window set', open: false };
  }
  if (open) {
    const until = program.admissionClosesAt
      ? String(program.admissionClosesAt).slice(0, 10)
      : 'open-ended';
    return { label: `Open until ${until}`, open: true };
  }
  return { label: 'Closed', open: false };
}

export interface ProgramStats {
  total: number;
  active: number;
  inactive: number;
  programs: Array<{
    name: string;
    code: string;
    departmentId: string;
    degreeLevel: string;
    status: string;
    offeringCount: number;
    batchCount: number;
    totalStudents: number;
  }>;
}

export type CurriculumType = 'Core' | 'Elective' | 'Optional';

export interface ProgramCurriculumItem {
  _id?: string;
  subjectId: string | {
    _id: string;
    code: string;
    name: string;
    credits: number;
    status?: string;
    departmentId?: string | { _id: string; name: string; code: string };
  };
  semester: number;
  type: CurriculumType;
  order: number;
  status: 'Active' | 'Inactive';
}

export interface ProgramCurriculumSemester {
  semester: number;
  items: ProgramCurriculumItem[];
  totalCredits: number;
}

export interface ProgramCurriculumData {
  program: Program;
  semesters: ProgramCurriculumSemester[];
  summary: {
    totalSubjects: number;
    totalCredits: number;
  };
}

export interface ProgramCurriculumEntry {
  subjectId: string;
  semester: number;
  type?: CurriculumType;
  order?: number;
  status?: 'Active' | 'Inactive';
}

class ProgramAPI {
  private baseUrl = '/programs';

  async getAll(params?: {
    departmentId?: string;
    degreeLevel?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
      if (params?.degreeLevel) queryParams.append('degreeLevel', params.degreeLevel);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program stats:', error);
      throw error;
    }
  }

  async create(data: Partial<Program>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Program>) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  }

  async getCurriculum(id: string): Promise<{ success: boolean; data: ProgramCurriculumData }> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/curriculum`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program curriculum:', error);
      throw error;
    }
  }

  async updateCurriculum(id: string, entries: ProgramCurriculumEntry[]) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/curriculum`, { entries });
      return response.data;
    } catch (error) {
      console.error('Error updating program curriculum:', error);
      throw error;
    }
  }
}

export const programAPI = new ProgramAPI();
export default programAPI;
