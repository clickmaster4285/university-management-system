import api from './axios';

export type ChallanPaymentStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue' | 'Scholarship' | 'Waived';

export interface FeeChallan {
  _id?: string;
  feeId?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRegistrationNo?: string;
  department: string;
  program: string;
  semester: number;
  studentCategory?: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: ChallanPaymentStatus;
  paymentMethod?: string;
  registrationId?: string;
  semesterRegistrationId?: string | { _id: string; registrationId: string; programSemester: number; status: string };
  source?: string;
  description?: string;
  challanSnapshot?: Record<string, unknown>;
  paymentHistory?: Array<{
    amount: number;
    method: string;
    date: string;
    transactionId?: string;
    notes?: string;
  }>;
  createdAt?: string;
}

export interface ChallanStats {
  total: number;
  byStatus: Record<ChallanPaymentStatus, number>;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
}

class FeeChallanAPI {
  async list(params?: {
    paymentStatus?: ChallanPaymentStatus;
    program?: string;
    semester?: number;
    studentId?: string;
  }) {
    const res = await api.get('/challans', { params });
    return (res.data?.data ?? []) as FeeChallan[];
  }

  async getById(id: string) {
    const res = await api.get(`/challans/${id}`);
    return res.data?.data as FeeChallan;
  }

  async getStats() {
    const res = await api.get('/challans/stats');
    return res.data?.data as ChallanStats;
  }

  async recordPayment(
    id: string,
    payload: { amount: number; paymentMethod?: string; transactionId?: string; notes?: string }
  ) {
    const res = await api.post(`/challans/${id}/payments`, payload);
    return res.data?.data as FeeChallan;
  }
}

export const feeChallanAPI = new FeeChallanAPI();
