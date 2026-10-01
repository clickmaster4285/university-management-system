import axios from 'axios';
import api from './axios';
import type { StudentDocument } from './studentAdmissions';

const normalizeApiBase = (value: string | undefined) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
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
  | 'Action Required'
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
  dateOfBirth?: string | null;
  gender?: string;
  nationality?: string;
  religion?: string;
  programId: string | RefSummary;
  campusId: string | RefSummary;
  academicSessionId?: string | RefSummary | null;
  guardian?: {
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelation?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  previousDegree?: string;
  previousMarks?: string;
  previousEducation?: Array<{
    institution?: string;
    degree?: string;
    grade?: string;
    yearOfCompletion?: number | null;
    percentage?: number | null;
  }>;
  source: 'public' | 'internal';
  status: ApplicationStatus;
  submittedAt?: string;
  remarks?: string;
  applicantMessage?: string;
  applicantReply?: string;
  applicantRepliedAt?: string;
  admissionDossierId?: string | { _id: string; admissionId: string; status: string };
  reviewedBy?: string | { firstName?: string; lastName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationStats {
  total: number;
  submitted: number;
  underReview: number;
  actionRequired?: number;
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
  totalCredits?: number;
  description?: string;
  departmentId?: RefSummary;
  department?: RefSummary | null;
  admissionOpensAt?: string | null;
  admissionClosesAt?: string | null;
  admissionOpen?: boolean;
  admissionLabel?: string;
}

export interface PublicCatalogCampus {
  _id: string;
  name: string;
  campusCode?: string;
  type?: string;
  isMainCampus?: boolean;
  city?: string;
  province?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
  } | null;
  description?: string;
  programCount?: number;
  openProgramCount?: number;
  categories?: PublicCatalogCategory[];
}

export interface PublicCatalogSession {
  _id: string;
  name: string;
  code?: string;
  status?: string;
}

export interface PublicCatalogCategory {
  key: string;
  label: string;
  programs: PublicCatalogProgram[];
}

export interface PublicCatalogUniversity {
  _id: string;
  universityName: string;
  shortName?: string;
  universityCode?: string;
  universityType?: string;
  website?: string;
  officialEmail?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
  } | null;
}

export interface PublicCatalogTree {
  university: PublicCatalogUniversity | null;
  campuses: PublicCatalogCampus[];
  summary: {
    campusCount: number;
    programCount: number;
    openProgramCount: number;
    generatedAt: string;
  };
}

export const studentApplicationsAPI = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/admissions/applications', { params });
    return response.data as { data: StudentApplication[]; total: number };
  },

  getStats: async (params?: { source?: string }) => {
    const response = await api.get('/admissions/applications/stats', { params });
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

  updateStatus: async (
    id: string,
    status: ApplicationStatus,
    remarks?: string,
    applicantMessage?: string
  ) => {
    const response = await api.patch(`/admissions/applications/${id}/status`, {
      status,
      remarks,
      applicantMessage,
    });
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

  /** University → campuses → categories → programs (open/closed). */
  getPublicCatalog: async () => {
    const response = await publicApi.get('/public/catalog');
    return (response.data?.data || {
      university: null,
      campuses: [],
      summary: { campusCount: 0, programCount: 0, openProgramCount: 0, generatedAt: '' },
    }) as PublicCatalogTree;
  },

  submitPublicApplication: async (payload: Record<string, unknown>) => {
    const response = await publicApi.post('/public/applications', payload);
    return response.data;
  },

  uploadPublicApplicationDocument: async (
    applicationId: string,
    payload: { file: File; documentType: string; documentName: string; cnic: string }
  ) => {
    const formData = new FormData();
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);
    formData.append('cnic', payload.cnic);
    formData.append('file', payload.file);
    const response = await publicApi.post(
      `/public/applications/${applicationId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { documentType: payload.documentType, documentName: payload.documentName },
      }
    );
    return response.data?.data;
  },

  listDocuments: async (applicationId: string) => {
    const response = await api.get(`/admissions/applications/${applicationId}/documents`);
    return (response.data?.data || []) as StudentDocument[];
  },

  uploadDocument: async (
    applicationId: string,
    payload: { file: File; documentType: string; documentName: string }
  ) => {
    const formData = new FormData();
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);
    formData.append('file', payload.file);
    const response = await api.post(
      `/admissions/applications/${applicationId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { documentType: payload.documentType, documentName: payload.documentName },
      }
    );
    return response.data?.data;
  },

  deleteDocument: async (applicationId: string, documentId: string) => {
    const response = await api.delete(
      `/admissions/applications/${applicationId}/documents/${documentId}`
    );
    return response.data;
  },

  reviewDocument: async (
    applicationId: string,
    documentId: string,
    payload: { reviewStatus: 'Pending' | 'Approved' | 'Rejected'; reviewNotes?: string }
  ) => {
    const response = await api.patch(
      `/admissions/applications/${applicationId}/documents/${documentId}/review`,
      payload
    );
    return response.data?.data as StudentDocument;
  },

  trackPublicApplication: async (applicationId: string, cnic: string) => {
    const response = await publicApi.get('/public/applications/track', {
      params: { applicationId, cnic },
    });
    return response.data?.data;
  },

  updatePublicApplication: async (
    applicationId: string,
    payload: Record<string, unknown> & { cnic: string; applicantReply?: string }
  ) => {
    const response = await publicApi.put(`/public/applications/${applicationId}`, payload);
    return response.data;
  },
};
