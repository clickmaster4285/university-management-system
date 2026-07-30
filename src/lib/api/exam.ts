import api from './axios';

export interface Exam {
  _id?: string;
  examId?: string;
  title: string;
  type: 'Midterm' | 'Final' | 'Quiz' | 'Lab Assessment' | 'Project Defense' | 'Case Study' | 'Written Exam' | 'Practical' | 'Viva' | 'Other';
  course: string;
  courseCode: string;
  department: string;
  program: string;
  semester: number;
  academicYear: string;
  instructor: string;
  instructorEmail?: string;
  totalMarks: number;
  passingMarks: number;
  weightage: number;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  hall: string;
  building?: string;
  invigilators: Array<{
    name: string;
    email: string; // Changed to required
  }>;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Postponed';
  grades: Array<{
    studentId: string;
    studentName: string;
    registrationNo?: string;
    obtainedMarks: number;
    grade: string;
    gpa: number;
    remarks?: string;
    isPresent: boolean;
  }>;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  resultsPublished: boolean;
  resultsPublishedDate?: string;
  instructions?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

class ExamAPI {
  private baseUrl = '/exams';

  async getAll(params?: {
    course?: string;
    status?: string;
    type?: string;
    instructor?: string;
    search?: string;
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
      console.error('Error fetching exams:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam:', error);
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam stats:', error);
      throw error;
    }
  }

  async addGrades(id: string, grades: any[]) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/grades`, { grades });
      return response.data;
    } catch (error) {
      console.error('Error adding grades:', error);
      throw error;
    }
  }

  async getGrades(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/grades`);
      return response.data;
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw error;
    }
  }

  async updateGrade(id: string, studentId: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/grades/${studentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating grade:', error);
      throw error;
    }
  }
}

export const examAPI = new ExamAPI();