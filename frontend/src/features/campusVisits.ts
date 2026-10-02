import api from './axios';

export type CampusVisitStatus = 'New' | 'Follow-up' | 'Closed' | 'Converted';
export type CampusVisitPurpose = 'Info' | 'Tour' | 'Counseling' | 'Other';

export interface CampusVisit {
  _id?: string;
  visitId: string;
  visitorName: string;
  phone?: string;
  email?: string;
  campusId?: string | { _id: string; name?: string; campusCode?: string };
  interestedProgramId?: string | { _id: string; name?: string; code?: string };
  purpose?: CampusVisitPurpose;
  notes?: string;
  visitedAt?: string;
  status?: CampusVisitStatus;
  createdAt?: string;
}

export const campusVisitsAPI = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/campus-visits', { params });
    return response.data as { data: CampusVisit[]; total: number };
  },
  create: async (payload: Partial<CampusVisit>) => {
    const response = await api.post('/campus-visits', payload);
    return response.data?.data as CampusVisit;
  },
  update: async (id: string, payload: Partial<CampusVisit>) => {
    const response = await api.put(`/campus-visits/${id}`, payload);
    return response.data?.data as CampusVisit;
  },
  remove: async (id: string) => {
    const response = await api.delete(`/campus-visits/${id}`);
    return response.data;
  },
};
