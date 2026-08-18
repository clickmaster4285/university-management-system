import api from './axios';

export interface FeeStructure {
  _id?: string;
  structureId?: string;
  name: string;
  department: string;
  program: string;
  semester: number;
  studentCategory?: string;
  academicYear: string;
  status?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  calculationMethod?: string;
  courses?: any[];
  additionalFees?: any[];
  discountEnabled?: boolean;
  discount?: any;
  lateFeeEnabled?: boolean;
  lateFee?: any;
  paymentType?: string;
  installments?: any[];
  notes?: string;
  totalCourseFee?: number;
  totalAdditionalFee?: number;
  grossTotal?: number;
  discountAmount?: number;
  finalPayable?: number;
  isActive?: boolean;
}

class FeeStructureAPI {
  private baseUrl = '/fee-structures';

  async getAll(params?: { department?: string; program?: string; semester?: number; status?: string; search?: string; limit?: number; page?: number }) {
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
      return {
        success: true,
        data: response.data?.data || response.data || [],
        pagination: response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 50 },
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching fee structures:', error);
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 50 },
        message: error.response?.data?.message || error.message || 'Failed to fetch fee structures'
      };
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response.data?.data || response.data,
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching fee structure:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to fetch fee structure'
      };
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Fee structure created successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to create fee structure'
      };
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Fee structure updated successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error updating fee structure:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to update fee structure'
      };
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        message: response.data?.message || 'Fee structure deleted successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error deleting fee structure:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete fee structure'
      };
    }
  }
}

export const feeStructureAPI = new FeeStructureAPI();
