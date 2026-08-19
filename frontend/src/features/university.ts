// src/features/university/index.ts
import { apiClient } from "./client";

export interface UniversityData {
  universityName: string;
  universityCode: string;
  shortName: string;
  universityType: string;
  registrationNumber: string;
  officialEmail: string;
  phoneNumber: string;
  website: string;
  country: string;
  province: string;
  city: string;
  address: string;
  academicSystem: string;
  gradingSystem: string;
  maxGPA: number;
  passingGPA: number;
  firstName: string;
  lastName: string;
  adminEmail: string;
  password: string;
  confirmPassword?: string;
}

export interface UniversityResponse {
  success: boolean;
  message: string;
  university: {
    id: string;
    universityId: string;
    universityName: string;
    universityCode: string;
    admin: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    universityId: string;
    universityName?: string;
    universityCode?: string;
    name?: string;
  };
  token?: string;
}

// ✅ Campus interface
export interface Campus {
  _id: string;
  campusId: string;
  name: string;
  campusCode: string;
  type?: string;
  address: {
    street: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  phone?: string;
  email?: string;
  establishedYear?: number;
  description?: string;
  status?: string;
  isMainCampus?: boolean;
  students?: any[];
  teachers?: any[];
  departments?: any[];
  courses?: any[];
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Updated University interface with campuses
export interface University {
  _id: string;
  universityId: string;
  universityName: string;
  universityCode: string;
  shortName: string;
  universityType: string;
  registrationNumber: string;
  officialEmail: string;
  phoneNumber: string;
  website: string;
  address: {
    country: string;
    province: string;
    city: string;
    street: string;
    postalCode?: string;
  };
  academicSettings: {
    academicSystem: string;
    gradingSystem: string;
    maxGPA: number;
    passingGPA: number;
  };
  administrator: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  campusCount?: number;
  userCount?: number;
  campuses?: Campus[];
  // ✅ Additional properties for backward compatibility
  country?: string;
  province?: string;
  city?: string;
  academicSystem?: string;
  gradingSystem?: string;
  maxGPA?: number;
  passingGPA?: number;
}

export interface UniversityStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalCourses: number;
  totalCampuses?: number;
}

// ✅ Updated response types - make them more flexible
export interface UniversitiesListResponse {
  success: boolean;
  data: University[];
  message?: string;
  // ✅ Add these for flexibility
  universities?: University[];
  results?: University[];
  items?: University[];
}

// ✅ Single university response
export interface UniversitySingleResponse {
  success: boolean;
  data: University;
  message?: string;
}

// ✅ Delete response
export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ✅ Check code response
export interface CheckCodeResponse {
  success: boolean;
  exists: boolean;
}

/**
 * Create a new university
 */
export const createUniversity = async (data: UniversityData): Promise<UniversityResponse> => {
  try {
    const response = await apiClient.post("/universities", data);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to create university";
    throw new Error(serverMessage);
  }
};

/**
 * Get all universities (Super Admin only)
 */
export const getUniversities = async (): Promise<UniversitiesListResponse> => {
  try {
    const response = await apiClient.get("/universities");
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to fetch universities";
    throw new Error(serverMessage);
  }
};

/**
 * Get a single university by ID
 */
export const getUniversityById = async (id: string): Promise<UniversitySingleResponse> => {
  try {
    const response = await apiClient.get(`/universities/${id}`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to fetch university";
    throw new Error(serverMessage);
  }
};

/**
 * Update a university
 */
export const updateUniversity = async (
  id: string, 
  data: Partial<UniversityData>
): Promise<UniversityResponse> => {
  try {
    const response = await apiClient.put(`/universities/${id}`, data);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to update university";
    throw new Error(serverMessage);
  }
};

/**
 * Delete a university
 */
export const deleteUniversity = async (id: string): Promise<DeleteResponse> => {
  try {
    const response = await apiClient.delete(`/universities/${id}`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to delete university";
    throw new Error(serverMessage);
  }
};

/**
 * Get university by code
 */
export const getUniversityByCode = async (code: string): Promise<UniversitySingleResponse> => {
  try {
    const response = await apiClient.get(`/universities/code/${code}`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to fetch university";
    throw new Error(serverMessage);
  }
};

/**
 * Get university statistics
 */
export const getUniversityStats = async (id: string): Promise<{ success: boolean; data: UniversityStats }> => {
  try {
    const response = await apiClient.get(`/universities/${id}/stats`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to fetch university stats";
    throw new Error(serverMessage);
  }
};

/**
 * Check if university code exists
 */
export const checkUniversityCode = async (code: string): Promise<CheckCodeResponse> => {
  try {
    const response = await apiClient.get(`/universities/check-code/${code}`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to check university code";
    throw new Error(serverMessage);
  }
};

// ✅ Export all types and functions
export default {
  createUniversity,
  getUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  getUniversityByCode,
  getUniversityStats,
  checkUniversityCode,
};