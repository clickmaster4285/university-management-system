// backend/src/routes/course.routes.js
import { Router } from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStats,
  getCoursesWithFee,
  getProgramFeeStructure,
  updateCourseFee,
  bulkUpdateCourseFees,
  createBulkCourses,
  getCoursesByDepartment,
  getCoursesByProgram,
  getCoursesBySemester,
  getCourseFeeSummary,
  toggleCourseStatus,
  getCourseByCode,
  getCoursesByInstructor,
  getActiveCourses,
  getCourseEnrollmentStats,
  assignInstructor,
  removeInstructor,
  addPrerequisite,
  removePrerequisite,
  enrollStudent,
  dropStudent,
  getCourseEnrollments,
  updateCourseCapacity,
  updateCourseSchedule,
  getCourseSchedule,
  addTextbook,
  removeTextbook,
  addLearningOutcome,
  removeLearningOutcome,
  getCourseFeeBreakdown,
  applyFeeWaiver,
  removeFeeWaiver,
  bulkUpdateCourseStatus,
  bulkDeleteCourses,
  checkSeeded,
  seedAllCourses
} from "../controllers/course.controller.js";

const router = Router();

// ==================== SEED ROUTES ====================
// Check if courses are seeded
router.get("/seeded", checkSeeded);

// Seed all courses - allow force reseed
router.post("/seed", seedAllCourses);

// ==================== COURSE MANAGEMENT ROUTES ====================

// Get all courses with filters
router.get("/", getCourses);

// Get active courses only
router.get("/active", getActiveCourses);

// Get course statistics for dashboard
router.get("/stats", getCourseStats);

// Get course enrollment statistics
router.get("/enrollment-stats", getCourseEnrollmentStats);

// Get course fee summary
router.get("/fee-summary", getCourseFeeSummary);

// Get courses with fee structure
router.get("/with-fee", getCoursesWithFee);

// Get courses by department
router.get("/department/:department", getCoursesByDepartment);

// Get courses by program
router.get("/program/:program", getCoursesByProgram);

// Get courses by semester
router.get("/semester/:semester", getCoursesBySemester);

// Get courses by instructor
router.get("/instructor/:instructorId", getCoursesByInstructor);

// Get program fee structure
router.get("/program/:program/fee-structure", getProgramFeeStructure);

// Get course by code
router.get("/code/:code", getCourseByCode);

// ==================== SINGLE COURSE ROUTES ====================

// Get course by ID
router.get("/:id", getCourseById);

// Create new course
router.post("/", createCourse);

// Create multiple courses at once
router.post("/bulk", createBulkCourses);

// Update course
router.put("/:id", updateCourse);

// Update course fee only
router.put("/:id/fee", updateCourseFee);

// Toggle course status
router.patch("/:id/toggle", toggleCourseStatus);

// Delete course
router.delete("/:id", deleteCourse);

// ==================== BULK OPERATIONS ====================

// Bulk update course fees
router.post("/bulk/fee", bulkUpdateCourseFees);

// Bulk update course status
router.patch("/bulk/status", bulkUpdateCourseStatus);

// Bulk delete courses
router.delete("/bulk", bulkDeleteCourses);

// ==================== COURSE ASSIGNMENT ROUTES ====================

// Assign instructor to course
router.post("/:id/assign-instructor", assignInstructor);

// Remove instructor from course
router.delete("/:id/instructor", removeInstructor);

// Add prerequisite to course
router.post("/:id/prerequisites", addPrerequisite);

// Remove prerequisite from course
router.delete("/:id/prerequisites/:prerequisiteId", removePrerequisite);

// ==================== COURSE ENROLLMENT ROUTES ====================

// Enroll student in course
router.post("/:id/enroll", enrollStudent);

// Drop student from course
router.delete("/:id/drop/:studentId", dropStudent);

// Get course enrollment list
router.get("/:id/enrollments", getCourseEnrollments);

// Update course capacity
router.put("/:id/capacity", updateCourseCapacity);

// ==================== COURSE SCHEDULE ROUTES ====================

// Update course schedule
router.put("/:id/schedule", updateCourseSchedule);

// Get course schedule
router.get("/:id/schedule", getCourseSchedule);

// ==================== COURSE MATERIALS ROUTES ====================

// Add textbook to course
router.post("/:id/textbooks", addTextbook);

// Remove textbook from course
router.delete("/:id/textbooks/:textbookId", removeTextbook);

// Add learning outcome to course
router.post("/:id/learning-outcomes", addLearningOutcome);

// Remove learning outcome from course
router.delete("/:id/learning-outcomes/:outcomeId", removeLearningOutcome);

// ==================== COURSE FEE MANAGEMENT ====================

// Get course fee breakdown
router.get("/:id/fee-breakdown", getCourseFeeBreakdown);

// Apply fee waiver to course
router.post("/:id/fee-waiver", applyFeeWaiver);

// Remove fee waiver from course
router.delete("/:id/fee-waiver", removeFeeWaiver);

export default router;