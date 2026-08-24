import { apiClient } from "./client";

export interface Campus {
  _id: string;
  campusId: string;
  campusCode: string;
  universityId: string;
  name: string;
  type: string;
  isMainCampus: boolean;
  address: {
    street: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  };
  phone: string;
  email: string;
  establishedYear?: number;
  description: string;
  status: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampusData {
  name: string;
  campusCode: string;
  type?: string;
  isMainCampus?: boolean;
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  establishedYear?: number;
  description?: string;
  status?: string;
}

export interface CampusResponse {
  success: boolean;
  message?: string;
  data?: Campus | Campus[];
  count?: number;
}

export const campusAPI = {
  create: async (data: CampusData): Promise<CampusResponse> => {
    try {
      // Remove /api prefix - apiClient already adds it
      const response = await apiClient.post("/campuses", data);
      return response.data;
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.message || "Failed to create campus";
      throw new Error(serverMessage);
    }
  },
  
  getAll: async (): Promise<CampusResponse> => {
    try {
      const response = await apiClient.get(`/campuses`);
      return response.data;
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.message || "Failed to fetch campuses";
      throw new Error(serverMessage);
    }
  },
  
  getById: async (id: string): Promise<CampusResponse> => {
    try {
      // Remove /api prefix - apiClient already adds it
      const response = await apiClient.get(`/campuses/${id}`);
      return response.data;
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.message || "Failed to fetch campus";
      throw new Error(serverMessage);
    }
  },
  
  update: async (id: string, data: Partial<CampusData>): Promise<CampusResponse> => {
    try {
      // Remove /api prefix - apiClient already adds it
      const response = await apiClient.put(`/campuses/${id}`, data);
      return response.data;
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.message || "Failed to update campus";
      throw new Error(serverMessage);
    }
  },
  
  delete: async (id: string): Promise<CampusResponse> => {
    try {
      const response = await apiClient.delete(`/campuses/${id}`);
      return response.data;
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.message || "Failed to delete campus";
      throw new Error(serverMessage);
    }
  },
};