import api from './axios';

export interface Event {
  _id?: string;
  eventId?: string;
  title: string;
  description: string;
  type: 'Seminar' | 'Workshop' | 'Conference' | 'Sports' | 'Cultural' | 'Academic' | 'Career Fair' | 'Hackathon' | 'Convocation' | 'Other';
  category: 'Academic' | 'Sports' | 'Cultural' | 'Social' | 'Career' | 'Technical' | 'Other';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  address?: string;
  campus: string;
  organizer: string;
  organizerEmail?: string;
  organizerPhone?: string;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  registrationDeadline?: string;
  isRegistrationRequired: boolean;
  registrationFee: number;
  speakers: Array<{
    name: string;
    title?: string;
    company?: string;
    bio?: string;
    email?: string;
    photo?: string;
  }>;
  schedule: Array<{
    time: string;
    activity: string;
    speaker?: string;
    location?: string;
  }>;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Postponed';
  isFeatured: boolean;
  isPublished: boolean;
  imageUrl?: string;
  bannerImage?: string;
  gallery?: Array<{ url: string; caption: string }>;
  attachments?: Array<{ name: string; url: string; type: string }>;
  tags?: string[];
  targetAudience?: string[];
  totalAttendees: number;
  rating: number;
  ratingCount: number;
  prerequisites?: string;
  dressCode?: string;
  parkingInfo?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

class EventAPI {
  private baseUrl = '/events';

  async getAll(params?: {
    type?: string;
    status?: string;
    category?: string;
    campus?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    isFeatured?: boolean;
    limit?: number;
    page?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  }

  async registerForEvent(id: string, userData: any) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }
}

export const eventAPI = new EventAPI();