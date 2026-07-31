// src/lib/api/reports.ts
import api from './axios';

export interface Report {
  _id?: string;
  reportId?: string;
  name: string;
  category: string;
  description?: string;
  type: 'PDF' | 'CSV' | 'Excel' | 'JSON';
  parameters?: any;
  data?: any;
  generatedBy?: any;
  generatedAt?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  fileUrl?: string;
  schedule?: {
    enabled: boolean;
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
    lastRun?: string;
    nextRun?: string;
  };
  recipients?: Array<{ email: string; name: string }>;
  tags?: string[];
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportCategory {
  id: string;
  label: string;
  icon: string;
}

export interface ReportStats {
  total: number;
  byCategory: Array<{ _id: string; count: number }>;
  recent: Report[];
}

export const reportAPI = {
  // Get all reports
  getAll: async (): Promise<{ success: boolean; data: Report[]; count: number }> => {
    const response = await api.get('/reports');
    return response.data;
  },

  // Get report by ID
  getById: async (id: string): Promise<{ success: boolean; data: Report }> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  // Get report stats
  getStats: async (): Promise<{ success: boolean; data: ReportStats }> => {
    const response = await api.get('/reports/stats');
    return response.data;
  },

  // Get report categories
  getCategories: async (): Promise<{ success: boolean; data: ReportCategory[] }> => {
    const response = await api.get('/reports/categories');
    return response.data;
  },

  // Generate a new report
  generate: async (data: Partial<Report>): Promise<{ success: boolean; data: Report; message: string }> => {
    const response = await api.post('/reports/generate', data);
    return response.data;
  },

  // Update report
  update: async (id: string, data: Partial<Report>): Promise<{ success: boolean; data: Report; message: string }> => {
    const response = await api.put(`/reports/${id}`, data);
    return response.data;
  },

  // Delete/Archive report
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  // Export as CSV
  exportCSV: async (id: string): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/export/csv`, {
      responseType: 'blob'
    });
    return response.data;
  }
};