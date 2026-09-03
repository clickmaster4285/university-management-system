import api from './axios';

export interface Admission {
  _id?: string;
  admissionId?: string;
  name: string;
  fatherName: string;
  motherName: string;
  cnic: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  nationality: string;
  religion: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  program: string;
  department: string;
  semester: number;
  academicYear: string;
  previousEducation: {
    institution: string;
    degree: string;
    grade: string;
    yearOfCompletion: number;
    percentage: number;
  };
  status: 'Pending' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Accepted' | 'Rejected' | 'Waitlisted' | 'Enrolled';
  applicationDate: string;
  reviewDate?: string;
  interviewDate?: string;
  decisionDate?: string;
  remarks?: string;
  rejectionReason?: string;
  campus: string;
  admissionOfficer?: string;
  applicationFee: number;
  feeStatus: 'Pending' | 'Paid' | 'Waived' | 'Partial';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdmissionStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  byStatus: Array<{ _id: string; count: number }>;
}

class AdmissionAPI {
  // Remove /api from here since it's already in the baseURL
  private baseUrl = '/admissions/legacy';

  async getAll(params?: {
    status?: string;
    program?: string;
    department?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching admissions:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admission:', error);
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating admission:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating admission:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: string, remarks?: string, rejectionReason?: string) {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/status`, {
        status,
        remarks,
        rejectionReason
      });
      return response.data;
    } catch (error) {
      console.error('Error updating admission status:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting admission:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admission stats:', error);
      throw error;
    }
  }
}

export const admissionAPI = new AdmissionAPI();