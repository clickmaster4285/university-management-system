// frontend/src/lib/api/dashboard.ts
import api from './axios';

export interface DashboardStats {
  overview: {
    totalStudents: number;
    activeStudents: number;
    totalTeachers: number;
    totalDepartments: number;
    totalOfferings: number;
    totalAdmissions: number;
    totalEmployees: number;
    pendingAdmissions: number;
    todayAttendance: number;
  };
  finance: {
    totalFees: number;
    paidFees: number;
    pendingFees: number;
  };
  recentActivities: {
    students: any[];
    admissions: any[];
    leaves: any[];
  };
  charts: {
    departmentDistribution: Array<{ _id: string; count: number }>;
    programDistribution: Array<{ _id: string; count: number }>;
    enrollmentTrend: Array<{ _id: { year: number; month: number }; count: number }>;
    admissionStatus: Array<{ _id: string; count: number }>;
    attendance: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
  };
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export const dashboardAPI = {
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  
  getActivities: async (limit?: number): Promise<{ success: boolean; data: Activity[] }> => {
    const response = await api.get(`/dashboard/activities${limit ? `?limit=${limit}` : ''}`);
    return response.data;
  },
  
  getOverview: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  }
};