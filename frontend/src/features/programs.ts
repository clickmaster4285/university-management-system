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
  createdAt?: string;
  updatedAt?: string;
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
    courseCount: number;
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
