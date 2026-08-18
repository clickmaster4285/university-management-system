import api from './axios';

export interface Bus {
  _id?: string;
  busId?: string;
  busNumber: string;
  registrationNumber: string;
  model: string;
  make: string;
  year: number;
  capacity: number;
  fuelType: string;
  routeId?: string;
  routeName?: string;
  driverId?: string;
  driverName?: string;
  status: string;
  isActive: boolean;
  fuelLevel: number;
  fuelConsumption: number;
  currentLocation?: { latitude: number; longitude: number; lastUpdated: string };
  totalTrips: number;
  totalKilometers: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  _id?: string;
  driverId?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseClass: string;
  hireDate: string;
  employmentStatus: string;
  salary?: number;
  experienceYears: number;
  assignedBusId?: string;
  assignedBusNumber?: string;
  status: string;
  isActive: boolean;
  totalTrips: number;
  totalHours: number;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Route {
  _id?: string;
  routeId?: string;
  routeNumber: string;
  name: string;
  description?: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  duration: number;
  stops: Array<{
    name: string;
    order: number;
    latitude?: number;
    longitude?: number;
    timeFromStart?: number;
    fare?: number;
  }>;
  departureTimes: Array<{
    day: string;
    time: string;
  }>;
  assignedBusIds?: string[];
  assignedBusNumbers?: string[];
  assignedDriverIds?: string[];
  baseFare: number;
  farePerKm: number;
  status: string;
  isActive: boolean;
  routeType: string;
  dailyRiders: number;
  totalTrips: number;
  createdAt?: string;
  updatedAt?: string;
}

class TransportAPI {
  private baseUrl = '/transport';

  // Bus methods
  async getBuses(params?: { status?: string; search?: string; limit?: number; page?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/buses?${queryParams}` : `${this.baseUrl}/buses`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      throw error;
    }
  }

  async getBusById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/buses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bus:', error);
      throw error;
    }
  }

  async createBus(data: any) {
    try {
      const response = await api.post(`${this.baseUrl}/buses`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating bus:', error);
      throw error;
    }
  }

  async updateBus(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/buses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating bus:', error);
      throw error;
    }
  }

  async deleteBus(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/buses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bus:', error);
      throw error;
    }
  }

  // Driver methods
  async getDrivers(params?: { status?: string; search?: string; limit?: number; page?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/drivers?${queryParams}` : `${this.baseUrl}/drivers`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  }

  async createDriver(data: any) {
    try {
      const response = await api.post(`${this.baseUrl}/drivers`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/drivers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  async deleteDriver(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/drivers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }
  }

  // Route methods
  async getRoutes(params?: { status?: string; search?: string; limit?: number; page?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/routes?${queryParams}` : `${this.baseUrl}/routes`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }

  async createRoute(data: any) {
    try {
      const response = await api.post(`${this.baseUrl}/routes`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  }

  async updateRoute(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/routes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating route:', error);
      throw error;
    }
  }

  async deleteRoute(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/routes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }

  // Statistics
  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transport stats:', error);
      throw error;
    }
  }
}

export const transportAPI = new TransportAPI();