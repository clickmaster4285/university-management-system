// src/lib/api/finance.ts
import api from './axios';

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface BudgetAllocation {
  name: string;
  percentage: number;
  amount: number;
}

export interface Invoice {
  invoiceId: string;
  vendor: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
  dueDate: string;
  issuedDate: string;
  description?: string;
  category?: string;
}

export interface Finance {
  _id?: string;
  revenueYTD: number;
  expenses: number;
  netIncome: number;
  monthlyData: MonthlyData[];
  budgetAllocation: BudgetAllocation[];
  invoices: Invoice[];
  totalInvoices: number;
  fiscalYear: string;
  lastUpdated: string;
}

export interface FinanceSummary {
  revenueYTD: number;
  expenses: number;
  netIncome: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
}

export const financeAPI = {
  // Get all finance data
  getAll: async (): Promise<{ success: boolean; data: Finance }> => {
    const response = await api.get('/finance');
    return response.data;
  },

  // Get finance summary
  getSummary: async (): Promise<{ success: boolean; data: FinanceSummary }> => {
    const response = await api.get('/finance/summary');
    return response.data;
  },

  // Update monthly data
  updateMonthly: async (data: { month: string; revenue: number; expenses: number }): Promise<{ success: boolean; data: Finance }> => {
    const response = await api.put('/finance/monthly', data);
    return response.data;
  },

  // Add invoice
  addInvoice: async (data: Partial<Invoice>): Promise<{ success: boolean; data: Finance }> => {
    const response = await api.post('/finance/invoices', data);
    return response.data;
  },

  // Update invoice status
  updateInvoiceStatus: async (invoiceId: string, status: string): Promise<{ success: boolean; data: Finance }> => {
    const response = await api.put(`/finance/invoices/${invoiceId}`, { status });
    return response.data;
  },

  // Delete invoice
  deleteInvoice: async (invoiceId: string): Promise<{ success: boolean; data: Finance }> => {
    const response = await api.delete(`/finance/invoices/${invoiceId}`);
    return response.data;
  },

  // Update budget allocation
  updateBudget: async (allocations: BudgetAllocation[]): Promise<{ success: boolean; data: Finance }> => {
    const response = await api.put('/finance/budget', { allocations });
    return response.data;
  }
};