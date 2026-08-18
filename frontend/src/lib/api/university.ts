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
    name?: string; // Add this for compatibility
  };
  token?: string;
}

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
}

export interface UniversityStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalCourses: number;
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
export const getUniversities = async (): Promise<{ success: boolean; data: University[] }> => {
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
export const getUniversityById = async (id: string): Promise<{ success: boolean; data: University }> => {
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
export const deleteUniversity = async (id: string): Promise<{ success: boolean; message: string }> => {
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
export const getUniversityByCode = async (code: string): Promise<{ success: boolean; data: University }> => {
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
export const checkUniversityCode = async (code: string): Promise<{ success: boolean; exists: boolean }> => {
  try {
    const response = await apiClient.get(`/universities/check-code/${code}`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message || error?.message || "Failed to check university code";
    throw new Error(serverMessage);
  }
};