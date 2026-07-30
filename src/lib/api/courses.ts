import api from './axios';

export interface Course {
  _id?: string;
  courseId?: string;
  code: string;
  name: string;
  department: string;
  departmentName: string;
  credits: number;
  instructor: string;
  instructorEmail?: string; // Add this optional field
  semester: 'Fall' | 'Spring' | 'Summer';
  year: number;
  capacity: number;
  enrolledStudents: number;
  status: 'Active' | 'Inactive' | 'Completed' | 'Cancelled';
  description?: string;
  prerequisites?: string[];
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

class CourseAPI {
  private baseUrl = '/courses';

  async getAll(params?: {
    department?: string;
    status?: string;
    search?: string;
    isActive?: boolean;
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
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  async getByCode(code: string) {
    try {
      const response = await api.get(`${this.baseUrl}/code/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course by code:', error);
      throw error;
    }
  }

  async getByDepartment(department: string) {
    try {
      const response = await api.get(`${this.baseUrl}/department/${department}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses by department:', error);
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }
}

export const courseAPI = new CourseAPI();