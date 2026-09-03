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
}

export interface UniversityStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalAdmins: number;
  totalUsers: number;
  totalCampuses: number;
  totalFaculties: number;
  totalDepartments: number;
  totalPrograms: number;
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
  status: string;
  isActive: boolean;
  campusCount: number;
  userCount: number;
  stats: UniversityStats;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityResponse {
  success: boolean;
  message?: string;
  data: University;
}

/**
 * Get the single university (there is only one)
 */
export const getUniversity = async (): Promise<UniversityResponse> => {
  const response = await apiClient.get("/universities");
  return response.data;
};

/**
 * Create the university (Admin only — must be seeded admin)
 */
export const createUniversity = async (data: UniversityData): Promise<UniversityResponse> => {
  const response = await apiClient.post("/universities", data);
  return response.data;
};

/**
 * Update the university (Admin only, no :id needed)
 */
export const updateUniversity = async (data: Partial<UniversityData>): Promise<UniversityResponse> => {
  const response = await apiClient.put("/universities", data);
  return response.data;
};

/**
 * Delete the university (Admin only, cascades soft-delete to Users + Campuses)
 */
export const deleteUniversity = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete("/universities");
  return response.data;
};

/**
 * Legacy compat — calls getUniversity()
 * @deprecated use getUniversity()
 */
export const getUniversities = getUniversity;

/**
 * Legacy compat — calls getUniversity()
 * @deprecated use getUniversity()
 */
export const getUniversityById = async (): Promise<{ success: boolean; data: University }> => {
  const result = await getUniversity();
  return { success: result.success, data: result.data };
};

/**
 * Legacy compat — calls updateUniversity()
 * @deprecated use updateUniversity()
 */
export const updateUniversityById = async (
  _id: string,
  data: Partial<UniversityData>
): Promise<UniversityResponse> => {
  return updateUniversity(data);
};
