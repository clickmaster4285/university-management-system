import api from './axios';

export interface Assignment {
  _id?: string;
  assignmentId?: string;
  title: string;
  description: string;
  course: string;
  courseCode: string;
  department: string;
  program: string;
  semester: number;
  academicYear: string;
  instructor: string;
  instructorEmail?: string;
  type: 'Homework' | 'Quiz' | 'Project' | 'Lab Report' | 'Research Paper' | 'Presentation' | 'Case Study' | 'Other';
  maxScore: number;
  passingScore: number;
  weightage: number;
  dueDate: string;
  submissionDeadline: string;
  lateSubmissionDeadline?: string;
  allowLateSubmissions: boolean;
  lateSubmissionPenalty: number;
  maxAttempts: number;
  submissionType: 'File Upload' | 'Text Entry' | 'Link' | 'Multiple';
  allowedFileTypes: string[];
  maxFileSize: number;
  status: 'Draft' | 'Published' | 'Open' | 'Closed' | 'Grading' | 'Graded' | 'Archived';
  isActive: boolean;
  isGraded: boolean;
  showGrades: boolean;
  instructions?: string;
  gradingCriteria?: string;
  rubric: Array<{
    criterion: string;
    description: string;
    maxPoints: number;
  }>;
  attachments: Array<{
    filename: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  resources: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

class AssignmentAPI {
  private baseUrl = 'assignments';

  async getAll(params?: {
    course?: string;
    status?: string;
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
      
      // Try to extract data from various response formats
      let data = [];
      let pagination = {};
      
      if (response.data) {
        // Format 1: { success: true, data: [...], pagination: {...} }
        if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
          pagination = response.data.pagination || {};
        }
        // Format 2: { data: [...], pagination: {...} } (without success)
        else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
          pagination = response.data.pagination || {};
        }
        // Format 3: [{...}, {...}] (direct array)
        else if (Array.isArray(response.data)) {
          data = response.data;
        }
        // Format 4: { assignments: [...], pagination: {...} }
        else if (response.data.assignments && Array.isArray(response.data.assignments)) {
          data = response.data.assignments;
          pagination = response.data.pagination || {};
        }
        // Format 5: { data: { assignments: [...] } }
        else if (response.data.data && response.data.data.assignments && Array.isArray(response.data.data.assignments)) {
          data = response.data.data.assignments;
          pagination = response.data.data.pagination || {};
        }
        // Fallback: try to find any array in the response
        else {
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              data = response.data[key];
              break;
            }
          }
        }
      }
      
      
      return {
        success: true,
        data: data,
        pagination: pagination
      };
    } catch (error: any) {
      console.error('❌ Error fetching assignments:', error);
      return {
        success: false,
        data: [],
        pagination: {},
        message: error.message || 'Failed to fetch assignments'
      };
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response.data?.data || response.data,
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch assignment'
      };
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Assignment created successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to create assignment'
      };
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Assignment updated successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to update assignment'
      };
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        message: response.data?.message || 'Assignment deleted successfully',
        ...response.data
      };
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete assignment'
      };
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      
      let statsData = {
        total: 0,
        open: 0,
        grading: 0,
        graded: 0,
        draft: 0,
        closed: 0
      };
      
      if (response.data) {
        // Check for various response formats
        if (response.data.data) {
          statsData = {
            total: response.data.data.total || 0,
            open: response.data.data.open || 0,
            grading: response.data.data.grading || 0,
            graded: response.data.data.graded || 0,
            draft: response.data.data.draft || 0,
            closed: response.data.data.closed || 0
          };
        } else {
          statsData = {
            total: response.data.total || 0,
            open: response.data.open || 0,
            grading: response.data.grading || 0,
            graded: response.data.graded || 0,
            draft: response.data.draft || 0,
            closed: response.data.closed || 0
          };
        }
      }
      
      return {
        success: true,
        data: statsData,
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching assignment stats:', error);
      return {
        success: false,
        data: {
          total: 0,
          open: 0,
          grading: 0,
          graded: 0,
          draft: 0,
          closed: 0
        },
        message: error.message || 'Failed to fetch stats'
      };
    }
  }

  async getByCourse(courseCode: string) {
    try {
      const response = await api.get(`${this.baseUrl}/course/${courseCode}`);
      return {
        success: true,
        data: response.data?.data || response.data || [],
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching assignments by course:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch assignments'
      };
    }
  }
}

export const assignmentAPI = new AssignmentAPI();