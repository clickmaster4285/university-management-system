import api from './axios';

export interface Fee {
  _id?: string;
  feeId?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRegistrationNo?: string;
  department: string;
  program: string;
  semester: number;
  feeType: 'Tuition' | 'Hostel' | 'Transport' | 'Library' | 'Sports' | 'Lab' | 'Other';
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidDate?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Stripe' | 'JazzCash' | 'EasyPaisa' | 'Cheque' | 'Other';
  paymentStatus: 'Paid' | 'Pending' | 'Partial' | 'Overdue' | 'Scholarship' | 'Waived';
  transactionId?: string;
  paymentReference?: string;
  isScholarship: boolean;
  scholarshipPercentage: number;
  scholarshipAmount: number;
  scholarshipType?: 'Merit' | 'Need-based' | 'Sports' | 'Other';
  isInstallment: boolean;
  installmentCount: number;
  installmentPaid: number;
  installmentDetails?: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: string;
  }>;
  lateFee: number;
  lateFeeApplied: boolean;
  lateFeeAppliedDate?: string;
  invoiceNumber?: string;
  invoiceGenerated: boolean;
  invoiceGeneratedDate?: string;
  remarks?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

class FeeAPI {
  private baseUrl = '/fees';

  async getAll(params?: {
    status?: string;
    studentId?: string;
    studentName?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    feeType?: string;
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
      
      // Always return a consistent structure
      return {
        success: true,
        data: response.data?.data || response.data || [],
        pagination: response.data?.pagination || {
          total: 0,
          page: 1,
          pages: 0,
          limit: 50
        },
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching fees:', error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 0,
          limit: 50
        },
        message: error.message || 'Failed to fetch fees'
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
      console.error('Error fetching fee:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch fee record'
      };
    }
  }

  async create(data: any) {
    try {
      console.log('📤 Creating fee:', data);
      const response = await api.post(this.baseUrl, data);
      console.log('📥 Create response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Fee record created successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error creating fee:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to create fee record'
      };
    }
  }

  async update(id: string, data: any) {
    try {
      console.log('📤 Updating fee:', id, data);
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      console.log('📥 Update response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Fee record updated successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error updating fee:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to update fee record'
      };
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        message: response.data?.message || 'Fee record deleted successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error deleting fee:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete fee record'
      };
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      console.log('📊 Stats response:', response.data);
      
      let statsData = {
        total: 0,
        paid: 0,
        pending: 0,
        partial: 0,
        overdue: 0,
        scholarship: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalScholarship: 0,
        totalLateFee: 0,
        feeTypeStats: [],
        recentTransactions: []
      };
      
      if (response.data) {
        if (response.data.data) {
          statsData = {
            total: response.data.data.total || 0,
            paid: response.data.data.paid || 0,
            pending: response.data.data.pending || 0,
            partial: response.data.data.partial || 0,
            overdue: response.data.data.overdue || 0,
            scholarship: response.data.data.scholarship || 0,
            totalAmount: response.data.data.totalAmount || 0,
            totalPaid: response.data.data.totalPaid || 0,
            totalScholarship: response.data.data.totalScholarship || 0,
            totalLateFee: response.data.data.totalLateFee || 0,
            feeTypeStats: response.data.data.feeTypeStats || [],
            recentTransactions: response.data.data.recentTransactions || []
          };
        } else {
          statsData = {
            total: response.data.total || 0,
            paid: response.data.paid || 0,
            pending: response.data.pending || 0,
            partial: response.data.partial || 0,
            overdue: response.data.overdue || 0,
            scholarship: response.data.scholarship || 0,
            totalAmount: response.data.totalAmount || 0,
            totalPaid: response.data.totalPaid || 0,
            totalScholarship: response.data.totalScholarship || 0,
            totalLateFee: response.data.totalLateFee || 0,
            feeTypeStats: response.data.feeTypeStats || [],
            recentTransactions: response.data.recentTransactions || []
          };
        }
      }
      
      console.log('📊 Extracted stats:', statsData);
      
      return {
        success: true,
        data: statsData,
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching fee stats:', error);
      return {
        success: false,
        data: {
          total: 0,
          paid: 0,
          pending: 0,
          partial: 0,
          overdue: 0,
          scholarship: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalScholarship: 0,
          totalLateFee: 0,
          feeTypeStats: [],
          recentTransactions: []
        },
        message: error.message || 'Failed to fetch statistics'
      };
    }
  }

  async processPayment(id: string, data: any) {
    try {
      console.log('📤 Processing payment for fee:', id, data);
      const response = await api.post(`${this.baseUrl}/${id}/pay`, data);
      console.log('📥 Payment response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Payment processed successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to process payment'
      };
    }
  }

  async generateInvoice(id: string) {
    try {
      console.log('📤 Generating invoice for fee:', id);
      const response = await api.post(`${this.baseUrl}/${id}/invoice`);
      console.log('📥 Invoice response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Invoice generated successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to generate invoice'
      };
    }
  }

  async applyLateFees(percentage: number = 5) {
    try {
      console.log('📤 Applying late fees with percentage:', percentage);
      const response = await api.post(`${this.baseUrl}/apply-late-fees?percentage=${percentage}`);
      console.log('📥 Late fees response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Late fees applied successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error applying late fees:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to apply late fees'
      };
    }
  }
}

export const feeAPI = new FeeAPI();