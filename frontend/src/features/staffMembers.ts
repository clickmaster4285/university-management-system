import api from './axios';

export type StaffStatus = 'Active' | 'On Leave' | 'Resigned' | 'Terminated' | 'Retired';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Visiting' | 'Intern';
export type PayFrequency = 'Monthly' | 'Bi-weekly' | 'Weekly';
export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export interface WorkScheduleDay {
  day: Weekday;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
}

export interface StaffCompensation {
  basicSalary?: number;
  allowances?: number;
  currency?: string;
  payFrequency?: PayFrequency;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  effectiveFrom?: string | null;
}

export interface StaffEmployment {
  _id?: string;
  departmentId: string | { _id: string; name: string; code?: string };
  campusId?: string | { _id: string; name: string; campusCode?: string } | null;
  designation: string;
  employmentType?: EmploymentType;
  isPrimary?: boolean;
  startDate?: string;
  endDate?: string | null;
}

export interface TeacherProfile {
  summary?: string;
  specialization?: string;
  researchInterests?: string[];
  qualifications?: Array<{
    degree?: string;
    institution?: string;
    country?: string;
    year?: number;
    grade?: string;
    field?: string;
  }>;
  experience?: Array<{
    organization?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  officeHours?: string;
  officeLocation?: string;
  orcid?: string;
  googleScholar?: string;
  researchGate?: string;
  linkedin?: string;
}

export interface StaffMember {
  _id?: string;
  staffId?: string;
  userId?:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        role?: string;
        primaryRole?: string;
        status?: string;
        moduleAccess?: Record<string, boolean>;
      }
    | null;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  cnic?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  joiningDate?: string | null;
  jobDescription?: string;
  workSchedule?: WorkScheduleDay[];
  compensation?: StaffCompensation;
  status: StaffStatus;
  isAcademic?: boolean;
  employments: StaffEmployment[];
  teacherProfile?: TeacherProfile | null;
  notes?: string;
  fullName?: string;
  createdAt?: string;
}

export interface StaffPayroll {
  _id?: string;
  payrollId?: string;
  staffMember?: string;
  employeeName?: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances?: number;
  bonuses?: number;
  deductions?: {
    tax?: number;
    insurance?: number;
    other?: number;
  };
  netPay?: number;
  status?: 'Draft' | 'Processed' | 'Paid' | 'Cancelled';
  paymentDate?: string | null;
  paymentMethod?: 'Bank Transfer' | 'Cash' | 'Cheque';
}

export interface StaffStats {
  total: number;
  active: number;
  academic: number;
  withLogin: number;
}

export const getStaffDisplayName = (staff: Pick<StaffMember, 'firstName' | 'lastName' | 'fullName'>) =>
  staff.fullName || `${staff.firstName} ${staff.lastName}`.trim();

export const defaultWorkSchedule = (): WorkScheduleDay[] =>
  WEEKDAYS.map((day) => ({
    day,
    isWorkingDay: !['Saturday', 'Sunday'].includes(day),
    startTime: '09:00',
    endTime: '17:00',
  }));

export type StaffPayload = Omit<StaffMember, '_id' | 'staffId' | 'userId' | 'fullName' | 'createdAt'>;

class StaffMemberAPI {
  async getAll(params?: {
    departmentId?: string;
    status?: StaffStatus;
    isAcademic?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await api.get('/staff', { params });
    return res.data;
  }

  async getById(id: string) {
    const res = await api.get(`/staff/${id}`);
    return res.data?.data as StaffMember;
  }

  async getStats() {
    const res = await api.get('/staff/stats');
    return res.data?.data as StaffStats;
  }

  async listAcademic(limit = 200) {
    const res = await api.get('/staff', { params: { isAcademic: true, limit } });
    return (res.data?.data ?? []) as StaffMember[];
  }

  async getPlatformRoles() {
    const res = await api.get('/staff/roles');
    return (res.data?.data ?? []) as string[];
  }

  async create(payload: StaffPayload) {
    const res = await api.post('/staff', payload);
    return res.data?.data as StaffMember;
  }

  async update(id: string, payload: Partial<StaffPayload>) {
    const res = await api.put(`/staff/${id}`, payload);
    return res.data?.data as StaffMember;
  }

  async delete(id: string) {
    const res = await api.delete(`/staff/${id}`);
    return res.data;
  }

  async enableLogin(
    id: string,
    payload: { password: string; primaryRole: string; moduleAccess?: Record<string, boolean> }
  ) {
    const res = await api.post(`/staff/${id}/enable-login`, payload);
    return res.data?.data as StaffMember;
  }

  async updateLoginAccess(
    id: string,
    payload: { primaryRole?: string; moduleAccess?: Record<string, boolean> }
  ) {
    const res = await api.put(`/staff/${id}/login-access`, payload);
    return res.data?.data as StaffMember;
  }

  async disableLogin(id: string) {
    const res = await api.post(`/staff/${id}/disable-login`);
    return res.data?.data as StaffMember;
  }

  async getPayrolls(id: string) {
    const res = await api.get(`/staff/${id}/payroll`);
    return (res.data?.data ?? []) as StaffPayroll[];
  }

  async createPayroll(id: string, payload: Omit<StaffPayroll, '_id' | 'payrollId' | 'netPay'>) {
    const res = await api.post(`/staff/${id}/payroll`, payload);
    return res.data?.data as StaffPayroll;
  }

  async updatePayroll(id: string, payrollId: string, payload: Partial<StaffPayroll>) {
    const res = await api.put(`/staff/${id}/payroll/${payrollId}`, payload);
    return res.data?.data as StaffPayroll;
  }

  async deletePayroll(id: string, payrollId: string) {
    const res = await api.delete(`/staff/${id}/payroll/${payrollId}`);
    return res.data;
  }
}

export const staffMemberAPI = new StaffMemberAPI();
