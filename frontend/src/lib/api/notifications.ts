// src/lib/api/notifications.ts
import api from './axios';

export interface Notification {
  _id?: string;
  notificationId?: string;
  title: string;
  message: string;
  type: 'alert' | 'broadcast' | 'reminder' | 'announcement' | 'emergency';
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'all';
  recipients?: string[];
  recipientCount?: number;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  scheduledAt?: string;
  sentAt?: string;
  deliveredCount?: number;
  failedCount?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'academic' | 'administrative' | 'emergency' | 'event' | 'fee' | 'general';
  isRead: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sendEmail?: boolean; // ✅ ADD THIS - optional property for creating notifications
}

export interface NotificationStats {
  total: number;
  unread: number;
  sent: number;
  pending: number;
  failed: number;
  byType: Array<{ _id: string; count: number }>;
  byChannel: Array<{ _id: string; count: number }>;
}

export const notificationAPI = {
  // Get all notifications
  getAll: async (): Promise<{ success: boolean; data: Notification[]; counts: { total: number; unread: number } }> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get notification by ID
  getById: async (id: string): Promise<{ success: boolean; data: Notification }> => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  // Create notification
  create: async (data: Partial<Notification>): Promise<{ success: boolean; data: Notification; email: any; message: string }> => {
    // Remove sendEmail from the data sent to the API since it's not a model field
    const { sendEmail, ...notificationData } = data;
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },

  // Update notification
  update: async (id: string, data: Partial<Notification>): Promise<{ success: boolean; data: Notification; message: string }> => {
    const response = await api.put(`/notifications/${id}`, data);
    return response.data;
  },

  // Delete notification
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: string): Promise<{ success: boolean; data: Notification; message: string }> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<{ success: boolean; data: NotificationStats }> => {
    const response = await api.get('/notifications/stats');
    return response.data;
  },

  // Send test email
  sendTestEmail: async (email?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/test-email', { email });
    return response.data;
  }
};