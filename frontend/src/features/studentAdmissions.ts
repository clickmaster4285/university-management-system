import api from './axios';
import type { RefSummary } from './studentApplications';

export type DossierStatus = 'In Progress' | 'Documents Pending' | 'Complete' | 'Enrolled';

export interface GuardianInfo {
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
}

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PreviousEducationEntry {
  institution?: string;
  degree?: string;
  grade?: string;
  yearOfCompletion?: number | null;
  percentage?: number | null;
}

export interface StudentAdmissionDossier {
  _id?: string;
  admissionId: string;
  applicationId?: string | { applicationId: string; status: string; source: string };
  studentId?: string | { studentId: string; firstName: string; lastName: string; status: string };
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cnic: string;
  dateOfBirth?: string | null;
  gender?: string;
  nationality?: string;
  religion?: string;
  programId: string | RefSummary;
  departmentId?: string | RefSummary | null;
  campusId: string | RefSummary;
  batchId?: string | RefSummary | null;
  academicSessionId?: string | RefSummary | null;
  guardian?: GuardianInfo;
  address?: AddressInfo;
  previousEducation?: PreviousEducationEntry[];
  status: DossierStatus;
  interviewDate?: string | null;
  decisionDate?: string | null;
  remarks?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StudentDocumentType =
  | 'cnic'
  | 'photo'
  | 'matric'
  | 'intermediate'
  | 'bachelor'
  | 'domicile'
  | 'character_certificate'
  | 'migration'
  | 'other';

export const STUDENT_DOCUMENT_TYPE_LABELS: Record<StudentDocumentType, string> = {
  cnic: 'CNIC',
  photo: 'Photo',
  matric: 'Matric certificate',
  intermediate: 'Intermediate certificate',
  bachelor: 'Bachelor certificate',
  domicile: 'Domicile',
  character_certificate: 'Character certificate',
  migration: 'Migration certificate',
  other: 'Other',
};

export interface StudentDocument {
  _id?: string;
  documentId?: string;
  documentType: StudentDocumentType;
  documentName: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  relativePath?: string;
  notes?: string;
  createdAt?: string;
}

export const serializeDossierPayload = (dossier: Partial<StudentAdmissionDossier>) => {
  const refId = (value: string | RefSummary | null | undefined) => {
    if (value == null) return value;
    if (typeof value === 'object') return value._id;
    return value;
  };

  return {
    firstName: dossier.firstName,
    lastName: dossier.lastName,
    email: dossier.email,
    phone: dossier.phone,
    cnic: dossier.cnic,
    dateOfBirth: dossier.dateOfBirth || null,
    gender: dossier.gender,
    nationality: dossier.nationality,
    religion: dossier.religion,
    programId: refId(dossier.programId),
    departmentId: refId(dossier.departmentId),
    campusId: refId(dossier.campusId),
    batchId: refId(dossier.batchId),
    academicSessionId: refId(dossier.academicSessionId),
    guardian: dossier.guardian,
    address: dossier.address,
    previousEducation: dossier.previousEducation,
    remarks: dossier.remarks,
    interviewDate: dossier.interviewDate,
    decisionDate: dossier.decisionDate,
  };
};

export const getAdmissionApiError = (err: unknown) => {
  const axiosErr = err as {
    response?: { data?: { message?: string; missingFields?: string[]; missingDocuments?: string[] } };
    responseData?: { message?: string; missingFields?: string[]; missingDocuments?: string[] };
    message?: string;
  };
  return axiosErr.response?.data || axiosErr.responseData || { message: axiosErr.message };
};

export const studentAdmissionsAPI = {
  listDossiers: async (params?: Record<string, string | number>) => {
    const response = await api.get('/admissions/dossiers', { params });
    return response.data as { data: StudentAdmissionDossier[]; total: number };
  },

  getDossier: async (id: string) => {
    const response = await api.get(`/admissions/dossiers/${id}`);
    return response.data?.data as StudentAdmissionDossier;
  },

  updateDossier: async (id: string, payload: Partial<StudentAdmissionDossier>) => {
    const response = await api.put(`/admissions/dossiers/${id}`, serializeDossierPayload(payload));
    return response.data?.data as StudentAdmissionDossier;
  },

  completeAdmission: async (id: string) => {
    const response = await api.post(`/admissions/dossiers/${id}/complete`);
    return response.data;
  },

  getDocumentTypes: async () => {
    const response = await api.get('/admissions/dossiers/document-types');
    return response.data?.data as { all: StudentDocumentType[]; required: StudentDocumentType[] };
  },

  listDossierDocuments: async (dossierId: string) => {
    const response = await api.get(`/admissions/dossiers/${dossierId}/documents`);
    return (response.data?.data || []) as StudentDocument[];
  },

  uploadDossierDocument: async (
    dossierId: string,
    payload: { file: File; documentType: StudentDocumentType; documentName: string; notes?: string }
  ) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);
    if (payload.notes) formData.append('notes', payload.notes);
    const response = await api.post(`/admissions/dossiers/${dossierId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data as StudentDocument;
  },

  deleteDossierDocument: async (dossierId: string, documentId: string) => {
    const response = await api.delete(`/admissions/dossiers/${dossierId}/documents/${documentId}`);
    return response.data;
  },

  listStudentDocuments: async (studentId: string) => {
    const response = await api.get(`/students/${studentId}/documents`);
    return (response.data?.data || []) as StudentDocument[];
  },

  uploadStudentDocument: async (
    studentId: string,
    payload: { file: File; documentType: StudentDocumentType; documentName: string; notes?: string }
  ) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);
    if (payload.notes) formData.append('notes', payload.notes);
    const response = await api.post(`/students/${studentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data as StudentDocument;
  },

  deleteStudentDocument: async (studentId: string, documentId: string) => {
    const response = await api.delete(`/students/${studentId}/documents/${documentId}`);
    return response.data;
  },
};
