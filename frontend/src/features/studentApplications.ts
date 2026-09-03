import axios from 'axios';
import api from './axios';

const normalizeApiBase = (value?: string) => {
  const fallback = 'http://localhost:4006/api';
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
};

export const publicApi = axios.create({
  baseURL: normalizeApiBase(import.meta.env.VITE_API_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Shortlisted'
  | 'Accepted'
  | 'Rejected'
  | 'Promoted';

export interface RefSummary {
  _id: string;
  name?: string;
  code?: string;
  campusCode?: string;
  degreeLevel?: string;
}

export interface StudentApplication {
  _id?: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  cnic: string;
  programId: string | RefSummary;
  campusId: string | RefSummary;
  academicSessionId?: string | RefSummary | null;
  previousDegree?: string;
  previousMarks?: string;
  source: 'public' | 'internal';
  status: ApplicationStatus;
  submittedAt?: string;
  remarks?: string;
  admissionDossierId?: string | { _id: string; admissionId: string; status: string };
  reviewedBy?: string | { firstName?: string; lastName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationStats {
  total: number;
  submitted: number;
  underReview: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
  promoted: number;
}

export interface PublicCatalogProgram {
  _id: string;
  name: string;
  code: string;
  degreeLevel?: string;
  duration?: number;
  departmentId?: RefSummary;
}

export interface PublicCatalogCampus {
  _id: string;
  name: string;
  campusCode?: string;
  city?: string;
  province?: string;
}

export interface PublicCatalogSession {
  _id: string;
  name: string;
  code?: string;
  status?: string;
}

export const studentApplicationsAPI = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/admissions/applications', { params });
    return response.data as { data: StudentApplication[]; total: number };
  },

  getStats: async () => {
    const response = await api.get('/admissions/applications/stats');
    return (response.data?.data || response.data) as ApplicationStats;
  },

  getById: async (id: string) => {
    const response = await api.get(`/admissions/applications/${id}`);
    return response.data?.data as StudentApplication;
  },

  createInternal: async (payload: Partial<StudentApplication>) => {
    const response = await api.post('/admissions/applications', payload);
    return response.data?.data as StudentApplication;
  },

  updateStatus: async (id: string, status: ApplicationStatus, remarks?: string) => {
    const response = await api.patch(`/admissions/applications/${id}/status`, { status, remarks });
    return response.data?.data as StudentApplication;
  },

  promote: async (id: string) => {
    const response = await api.post(`/admissions/applications/${id}/promote`);
    return response.data?.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/admissions/applications/${id}`);
    return response.data;
  },

  getPublicPrograms: async () => {
    const response = await publicApi.get('/public/catalog/programs');
    return (response.data?.data || []) as PublicCatalogProgram[];
  },

  getPublicCampuses: async () => {
    const response = await publicApi.get('/public/catalog/campuses');
    return (response.data?.data || []) as PublicCatalogCampus[];
  },

  getPublicSessions: async () => {
    const response = await publicApi.get('/public/catalog/sessions');
    return (response.data?.data || []) as PublicCatalogSession[];
  },

  submitPublicApplication: async (payload: Record<string, unknown>) => {
    const response = await publicApi.post('/public/applications', payload);
    return response.data;
  },

  trackPublicApplication: async (applicationId: string, cnic: string) => {
    const response = await publicApi.get('/public/applications/track', {
      params: { applicationId, cnic },
    });
    return response.data?.data;
  },
};
