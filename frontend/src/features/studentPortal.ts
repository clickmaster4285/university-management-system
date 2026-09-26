import { apiClient } from './client';
import type { Student } from './students';
import type { FeeChallan } from './feeChallan';

export interface StudentPortalRegistration {
  _id: string;
  registrationId?: string;
  programSemester?: number;
  status?: string;
  registrationMode?: string;
  programId?: string | { name?: string; code?: string };
  batchId?: string | { name?: string; code?: string };
  academicSessionId?: string | { name?: string; code?: string; startDate?: string; endDate?: string };
  createdAt?: string;
}

export const studentPortalAPI = {
  getMe: async () => {
    const result = await apiClient.get('/student-portal/me');
    return (result.data?.data || result.data) as Student;
  },

  getRegistrations: async () => {
    const result = await apiClient.get('/student-portal/registrations');
    const payload = result.data;
    if (Array.isArray(payload?.data)) return payload.data as StudentPortalRegistration[];
    return [];
  },

  getChallans: async () => {
    const result = await apiClient.get('/student-portal/challans');
    const payload = result.data;
    if (Array.isArray(payload?.data)) return payload.data as FeeChallan[];
    return [];
  },
};
