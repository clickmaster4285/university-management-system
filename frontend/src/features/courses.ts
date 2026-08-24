// src/lib/api/courses.ts
import api from './axios';

export interface Course {
  _id?: string;
  courseId?: string;
  code: string;
  name: string;
  departmentId: string | { _id: string; name: string; code: string };
  program: string;
  programId?: string | { _id: string; name: string; code: string };
  credits: number;
  instructor: string;
  instructorId?: string | { _id: string; name: string; email: string; designation: string };
  semester: number;
  semesterType: 'Fall' | 'Spring' | 'Summer';
  year: number;
  capacity: number;
  enrolledStudents: number;
  waitlistCount: number;
  status: 'Active' | 'Inactive' | 'Completed' | 'Cancelled' | 'Draft';
  isActive: boolean;
  description?: string;
  prerequisites?: string[];
  prerequisitesCourses?: string[];
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    building?: string;
  };
  feePerCredit: number;
  totalFee: number;
  feeType: 'Tuition' | 'Lab' | 'Library' | 'Sports' | 'Transport' | 'Hostel' | 'Other';
  isFeeApplied: boolean;
  tags?: string[];
  learningOutcomes?: string[];
  textbooks?: {
    title: string;
    author: string;
    isbn: string;
    edition: string;
  }[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdatedAt?: string;
}

export interface CourseFilters {
  departmentId?: string;
  program?: string;
  programId?: string;
  semester?: number;
  semesterType?: string;
  year?: number;
  status?: string;
  isActive?: boolean;
  isFeeApplied?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseStats {
  overall: {
    totalCourses: number;
    avgCredits: number;
    totalCapacity: number;
    totalEnrolled: number;
    avgEnrollment: number;
    totalFee: number;
    avgFee: number;
  };
  byStatus: {
    active: number;
    inactive: number;
    completed: number;
    cancelled: number;
    draft: number;
  };
  byDepartment: Array<{
    _id: string;
    count: number;
    totalEnrolled: number;
    totalFee: number;
  }>;
  bySemester: Array<{
    _id: number;
    count: number;
  }>;
  byProgram: Array<{
    _id: string;
    count: number;
    totalEnrolled: number;
  }>;
}

export interface FeeStructure {
  _id: string;
  semesters: Array<{
    semester: number;
    totalFee: number;
    totalCredits: number;
    courseCount: number;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      feePerCredit: number;
      totalFee: number;
    }>;
  }>;
  departmentTotal: number;
}

export interface EnrollmentStats {
  summary: {
    totalEnrolled: number;
    totalCapacity: number;
    totalWaitlist: number;
    avgEnrollment: number;
    fullCourses: number;
    availableCourses: number;
  };
  topCourses: Array<{
    code: string;
    name: string;
    enrolledStudents: number;
    capacity: number;
    departmentName: string;
    program: string;
  }>;
}

export interface FeeSummary {
  _id: string;
  programs: Array<{
    program: string;
    semester: number;
    totalCourses: number;
    totalCredits: number;
    totalFee: number;
    avgFeePerCredit: number;
    minFee: number;
    maxFee: number;
  }>;
  departmentTotal: number;
  departmentCourses: number;
}

export interface CourseAssignment {
  academicYear: string;
  department: string;
  program: string;
  batch: number;
  semester: number;
  courseIds: string[];
  registrationStatus: 'Enabled' | 'Disabled';
  status: 'Active' | 'Inactive';
  assignedBy?: string;
  assignedAt?: string;
}

export interface AssignedCourse extends Course {
  isAssigned: boolean;
  assignmentId?: string;
  assignedAt?: string;
}

export interface SeedResponse {
  success: boolean;
  message: string;
  count: number;
  data?: Course[];
  alreadySeeded?: boolean;
}

export interface SeededResponse {
  success: boolean;
  seeded: boolean;
  count: number;
}

class CourseAPI {
  private baseUrl = '/courses';

  // ==================== GET COURSES ====================

  /**
   * Get all courses with filters
   */
  async getAll(params?: CourseFilters) {
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

  /**
   * Get active courses only
   */
  async getActiveCourses(params?: { departmentId?: string; program?: string; semester?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/active?${queryParams}` : `${this.baseUrl}/active`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching active courses:', error);
      throw error;
    }
  }

  /**
   * Get courses with fee structure (for fee management)
   */
  async getCoursesWithFee(params?: { departmentId?: string; program?: string; semester?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/with-fee?${queryParams}` : `${this.baseUrl}/with-fee`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses with fee:', error);
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  /**
   * Get course by code
   */
  async getByCode(code: string) {
    try {
      const response = await api.get(`${this.baseUrl}/code/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course by code:', error);
      throw error;
    }
  }

  /**
   * Get courses by department
   */
  async getByDepartment(departmentId: string, isActive: boolean = true) {
    try {
      const response = await api.get(`${this.baseUrl}/department/${departmentId}?isActive=${isActive}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses by department:', error);
      throw error;
    }
  }

  /**
   * Get courses by program
   */
  async getByProgram(program: string, params?: { semester?: number; isActive?: boolean }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() 
        ? `${this.baseUrl}/program/${program}?${queryParams}` 
        : `${this.baseUrl}/program/${program}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses by program:', error);
      throw error;
    }
  }

  /**
   * Get courses by semester
   */
  async getBySemester(semester: number, params?: { program?: string; departmentId?: string; isActive?: boolean }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() 
        ? `${this.baseUrl}/semester/${semester}?${queryParams}` 
        : `${this.baseUrl}/semester/${semester}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses by semester:', error);
      throw error;
    }
  }

  /**
   * Get courses by instructor
   */
  async getByInstructor(instructorId: string, params?: { semester?: number; isActive?: boolean }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() 
        ? `${this.baseUrl}/instructor/${instructorId}?${queryParams}` 
        : `${this.baseUrl}/instructor/${instructorId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses by instructor:', error);
      throw error;
    }
  }

  // ==================== COURSE ASSIGNMENT ====================

  /**
   * Get all course assignments
   */
  async getAssignments(params?: { departmentId?: string; program?: string; semester?: number; batch?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/assignments?${queryParams}` : `${this.baseUrl}/assignments`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      throw error;
    }
  }

  /**
   * Get courses available for assignment
   */
  async getAvailableCourses(params?: { departmentId?: string; program?: string; semester?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/available?${queryParams}` : `${this.baseUrl}/available`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching available courses:', error);
      throw error;
    }
  }

  /**
   * Assign courses to a batch
   */
  async assignCourses(data: CourseAssignment) {
    try {
      const response = await api.post(`${this.baseUrl}/assign`, data);
      return response.data;
    } catch (error) {
      console.error('Error assigning courses:', error);
      throw error;
    }
  }

  /**
   * Update course assignment
   */
  async updateAssignment(assignmentId: string, data: Partial<CourseAssignment>) {
    try {
      const response = await api.put(`${this.baseUrl}/assignments/${assignmentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating course assignment:', error);
      throw error;
    }
  }

  /**
   * Remove course assignment
   */
  async removeAssignment(assignmentId: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing course assignment:', error);
      throw error;
    }
  }

  /**
   * Get assigned courses for a batch
   */
  async getAssignedCourses(params: { program: string; batch: number; semester: number }) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const response = await api.get(`${this.baseUrl}/assigned?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      throw error;
    }
  }

  // ==================== FEE MANAGEMENT ====================

  /**
   * Get program fee structure
   */
  async getProgramFeeStructure(program: string): Promise<{ success: boolean; data: FeeStructure[] }> {
    try {
      const response = await api.get(`${this.baseUrl}/program/${program}/fee-structure`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program fee structure:', error);
      throw error;
    }
  }

  /**
   * Get course fee summary
   */
  async getFeeSummary(params?: { departmentId?: string; program?: string }): Promise<{ success: boolean; data: FeeSummary[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/fee-summary?${queryParams}` : `${this.baseUrl}/fee-summary`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching fee summary:', error);
      throw error;
    }
  }

  /**
   * Get course fee breakdown
   */
  async getCourseFeeBreakdown(id: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/fee-breakdown`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course fee breakdown:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get course statistics
   */
  async getStats(): Promise<{ success: boolean; data: CourseStats }> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course stats:', error);
      throw error;
    }
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(params?: { departmentId?: string; program?: string }): Promise<{ success: boolean; data: EnrollmentStats }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/enrollment-stats?${queryParams}` : `${this.baseUrl}/enrollment-stats`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollment stats:', error);
      throw error;
    }
  }

  // ==================== CREATE COURSES ====================

  /**
   * Create a new course
   */
  async create(data: Partial<Course>) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Create multiple courses at once (bulk upload)
   */
  async createBulk(courses: Partial<Course>[]) {
    try {
      const response = await api.post(`${this.baseUrl}/bulk`, { courses });
      return response.data;
    } catch (error) {
      console.error('Error creating bulk courses:', error);
      throw error;
    }
  }

  /**
   * Bulk update course fees
   */
  async bulkUpdateFees(courses: Array<{ courseId: string; feePerCredit?: number; isFeeApplied?: boolean; feeType?: string }>) {
    try {
      const response = await api.post(`${this.baseUrl}/bulk/fee`, { courses });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating course fees:', error);
      throw error;
    }
  }

  // ==================== UPDATE COURSES ====================

  /**
   * Update a course
   */
  async update(id: string, data: Partial<Course>) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Update course fee only
   */
  async updateFee(id: string, data: { feePerCredit?: number; isFeeApplied?: boolean; feeType?: string }) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/fee`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating course fee:', error);
      throw error;
    }
  }

  /**
   * Update course capacity
   */
  async updateCapacity(id: string, capacity: number) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/capacity`, { capacity });
      return response.data;
    } catch (error) {
      console.error('Error updating course capacity:', error);
      throw error;
    }
  }

  /**
   * Update course schedule
   */
  async updateSchedule(id: string, schedule: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/schedule`, { schedule });
      return response.data;
    } catch (error) {
      console.error('Error updating course schedule:', error);
      throw error;
    }
  }

  /**
   * Get course schedule
   */
  async getSchedule(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/schedule`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course schedule:', error);
      throw error;
    }
  }

  // ==================== COURSE ASSIGNMENTS ====================

  /**
   * Assign instructor to course
   */
  async assignInstructor(id: string, instructorId: string, instructorName?: string) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/assign-instructor`, { 
        instructorId, 
        instructorName 
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning instructor:', error);
      throw error;
    }
  }

  /**
   * Remove instructor from course
   */
  async removeInstructor(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/instructor`);
      return response.data;
    } catch (error) {
      console.error('Error removing instructor:', error);
      throw error;
    }
  }

  /**
   * Add prerequisite to course
   */
  async addPrerequisite(id: string, prerequisiteCode?: string, prerequisiteId?: string) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/prerequisites`, { 
        prerequisiteCode, 
        prerequisiteId 
      });
      return response.data;
    } catch (error) {
      console.error('Error adding prerequisite:', error);
      throw error;
    }
  }

  /**
   * Remove prerequisite from course
   */
  async removePrerequisite(id: string, prerequisiteId: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/prerequisites/${prerequisiteId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing prerequisite:', error);
      throw error;
    }
  }

  // ==================== ENROLLMENT ====================

  /**
   * Enroll student in course
   */
  async enrollStudent(id: string, studentId: string) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/enroll`, { studentId });
      return response.data;
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  }

  /**
   * Drop student from course
   */
  async dropStudent(id: string, studentId: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/drop/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error dropping student:', error);
      throw error;
    }
  }

  /**
   * Get course enrollments
   */
  async getEnrollments(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/enrollments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw error;
    }
  }

  // ==================== TEXTBOOKS & LEARNING OUTCOMES ====================

  /**
   * Add textbook to course
   */
  async addTextbook(id: string, textbook: { title: string; author: string; isbn?: string; edition?: string }) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/textbooks`, textbook);
      return response.data;
    } catch (error) {
      console.error('Error adding textbook:', error);
      throw error;
    }
  }

  /**
   * Remove textbook from course
   */
  async removeTextbook(id: string, textbookId: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/textbooks/${textbookId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing textbook:', error);
      throw error;
    }
  }

  /**
   * Add learning outcome to course
   */
  async addLearningOutcome(id: string, outcome: string) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/learning-outcomes`, { outcome });
      return response.data;
    } catch (error) {
      console.error('Error adding learning outcome:', error);
      throw error;
    }
  }

  /**
   * Remove learning outcome from course
   */
  async removeLearningOutcome(id: string, outcomeId: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/learning-outcomes/${outcomeId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing learning outcome:', error);
      throw error;
    }
  }

  // ==================== STATUS MANAGEMENT ====================

  /**
   * Toggle course status (Active/Inactive)
   */
  async toggleStatus(id: string) {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling course status:', error);
      throw error;
    }
  }

  /**
   * Bulk update course status
   */
  async bulkUpdateStatus(courseIds: string[], status?: string, isActive?: boolean) {
    try {
      const response = await api.patch(`${this.baseUrl}/bulk/status`, { courseIds, status, isActive });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating course status:', error);
      throw error;
    }
  }

  // ==================== FEE WAIVER ====================

  /**
   * Apply fee waiver to course
   */
  async applyFeeWaiver(id: string, waiverPercentage: number, waiverReason?: string) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/fee-waiver`, { 
        waiverPercentage, 
        waiverReason 
      });
      return response.data;
    } catch (error) {
      console.error('Error applying fee waiver:', error);
      throw error;
    }
  }

  /**
   * Remove fee waiver from course
   */
  async removeFeeWaiver(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/fee-waiver`);
      return response.data;
    } catch (error) {
      console.error('Error removing fee waiver:', error);
      throw error;
    }
  }

  // ==================== SEED DATA ====================

  /**
   * Seed all courses from the predefined list
   * @param force - Force reseed even if courses exist
   * @returns {Promise<SeedResponse>} Response with seed status
   */
  async seedAllCourses(force: boolean = false): Promise<SeedResponse> {
    try {
      const url = force ? `${this.baseUrl}/seed?force=true` : `${this.baseUrl}/seed`;
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      console.error('Error seeding courses:', error);
      throw error;
    }
  }

  /**
   * Check if courses have been seeded
   * @returns {Promise<SeededResponse>} Response with seeded status
   */
  async isSeeded(): Promise<SeededResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/seeded`);
      return response.data;
    } catch (error) {
      console.error('Error checking seeded status:', error);
      throw error;
    }
  }

  /**
   * Get courses by program and semester with fee structure
   */
  async getProgramSemesterCourses(program: string, semester: number) {
    try {
      const response = await api.get(`${this.baseUrl}/program/${program}/semester/${semester}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program semester courses:', error);
      throw error;
    }
  }

  /**
   * Get course summary by program
   */
  async getProgramSummary(program: string) {
    try {
      const response = await api.get(`${this.baseUrl}/program/${program}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program summary:', error);
      throw error;
    }
  }

  /**
   * Get course count by program
   */
  async getProgramCounts(): Promise<{ success: boolean; data: Record<string, number> }> {
    try {
      const response = await api.get(`${this.baseUrl}/counts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program counts:', error);
      throw error;
    }
  }

  // ==================== DELETE COURSES ====================

  /**
   * Delete a course (soft delete)
   */
  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Bulk delete courses (soft or hard delete)
   */
  async bulkDelete(courseIds: string[], softDelete: boolean = true) {
    try {
      const response = await api.delete(`${this.baseUrl}/bulk`, { 
        data: { courseIds, softDelete } 
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk deleting courses:', error);
      throw error;
    }
  }
}

export const courseAPI = new CourseAPI();
export default courseAPI;