// src/lib/api/hr.ts
import api from './axios';

export interface Employee {
  _id?: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joinDate?: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  status: 'Active' | 'On Leave' | 'Resigned' | 'Terminated' | 'On Probation';
  salary: number;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  skills?: string[];
  performanceRating?: number;
}

export interface Leave {
  _id?: string;
  leaveId?: string;
  employee: string;
  employeeName: string;
  type: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Other';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  days?: number;
  approvedBy?: string;
  approvedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payroll {
  _id?: string;
  payrollId?: string;
  employee: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  bonuses: number;
  deductions: {
    tax: number;
    insurance: number;
    other: number;
  };
  netPay: number;
  status: 'Draft' | 'Processed' | 'Paid' | 'Cancelled';
  paymentDate?: string;
  paymentMethod?: 'Bank Transfer' | 'Cash' | 'Cheque';
}

export interface Recruitment {
  _id?: string;
  positionId?: string;
  title: string;
  department: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  status: string;
  applicants: any[];
  postedDate: string;
  closingDate?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
}

export interface EmployeeOnLeave {
  _id?: string;
  leaveId?: string;
  employee: Employee;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
}

export const hrAPI = {
  // ==================== EMPLOYEES ====================
  getEmployees: async (): Promise<{ success: boolean; data: Employee[]; count?: number }> => {
    const response = await api.get('/hr/employees');
    return response.data;
  },

  getEmployeeStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/hr/employees/stats');
    return response.data;
  },

  getEmployeeById: async (id: string): Promise<{ success: boolean; data: Employee }> => {
    const response = await api.get(`/hr/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: Partial<Employee>): Promise<{ success: boolean; data: Employee; message: string }> => {
    const response = await api.post('/hr/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<{ success: boolean; data: Employee; message: string }> => {
    const response = await api.put(`/hr/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/hr/employees/${id}`);
    return response.data;
  },

  // ==================== LEAVES ====================
  getLeaves: async (): Promise<{ success: boolean; data: Leave[]; count?: number }> => {
    const response = await api.get('/hr/leaves');
    return response.data;
  },

  getLeaveStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/hr/leaves/stats');
    return response.data;
  },

  getLeaveById: async (id: string): Promise<{ success: boolean; data: Leave }> => {
    const response = await api.get(`/hr/leaves/${id}`);
    return response.data;
  },

  createLeave: async (data: Partial<Leave>): Promise<{ success: boolean; data: Leave; message: string }> => {
    const response = await api.post('/hr/leaves', data);
    return response.data;
  },

  updateLeave: async (id: string, data: Partial<Leave>): Promise<{ success: boolean; data: Leave; message: string }> => {
    const response = await api.put(`/hr/leaves/${id}`, data);
    return response.data;
  },

  updateLeaveStatus: async (id: string, status: string): Promise<{ success: boolean; data: Leave; message: string }> => {
    const response = await api.put(`/hr/leaves/${id}/status`, { status });
    return response.data;
  },

  deleteLeave: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/hr/leaves/${id}`);
    return response.data;
  },

  // NEW: Get employees currently on leave
  getEmployeesOnLeave: async (): Promise<{ success: boolean; data: EmployeeOnLeave[] }> => {
    const response = await api.get('/hr/leaves/employees-on-leave');
    return response.data;
  },

  // NEW: Trigger daily status update (admin only)
  dailyStatusUpdate: async (): Promise<{ success: boolean; message: string; updatedCount?: number }> => {
    const response = await api.post('/hr/leaves/daily-update');
    return response.data;
  },

  // ==================== PAYROLL ====================
  getPayroll: async (): Promise<{ success: boolean; data: Payroll[]; count?: number }> => {
    const response = await api.get('/hr/payroll');
    return response.data;
  },

  getPayrollStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/hr/payroll/stats');
    return response.data;
  },

  createPayroll: async (data: Partial<Payroll>): Promise<{ success: boolean; data: Payroll; message: string }> => {
    const response = await api.post('/hr/payroll', data);
    return response.data;
  },

  updatePayroll: async (id: string, data: Partial<Payroll>): Promise<{ success: boolean; data: Payroll; message: string }> => {
    const response = await api.put(`/hr/payroll/${id}`, data);
    return response.data;
  },

  deletePayroll: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/hr/payroll/${id}`);
    return response.data;
  },

  // ==================== RECRUITMENT ====================
  getRecruitments: async (): Promise<{ success: boolean; data: Recruitment[]; count?: number }> => {
    const response = await api.get('/hr/recruitment');
    return response.data;
  },

  getRecruitmentStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/hr/recruitment/stats');
    return response.data;
  },

  createRecruitment: async (data: Partial<Recruitment>): Promise<{ success: boolean; data: Recruitment; message: string }> => {
    const response = await api.post('/hr/recruitment', data);
    return response.data;
  },

  updateRecruitment: async (id: string, data: Partial<Recruitment>): Promise<{ success: boolean; data: Recruitment; message: string }> => {
    const response = await api.put(`/hr/recruitment/${id}`, data);
    return response.data;
  },

  deleteRecruitment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/hr/recruitment/${id}`);
    return response.data;
  },

  // ==================== DASHBOARD SUMMARY ====================
  getHRSummary: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/hr/summary');
    return response.data;
  }
};