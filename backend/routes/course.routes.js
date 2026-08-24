// backend/src/routes/course.routes.js
import { Router } from "express";
import { auth, authorize } from "../middleware/auth.js";
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

router.use(auth);

// ==================== SEED ROUTES ====================
router.get("/seeded", checkSeeded);
router.post("/seed", authorize("Admin"), seedAllCourses);

// ==================== COURSE MANAGEMENT ROUTES ====================
router.get("/", getCourses);
router.get("/active", getActiveCourses);
router.get("/stats", getCourseStats);
router.get("/enrollment-stats", getCourseEnrollmentStats);
router.get("/fee-summary", getCourseFeeSummary);
router.get("/with-fee", getCoursesWithFee);
router.get("/department/:departmentId", getCoursesByDepartment);
router.get("/program/:program", getCoursesByProgram);
router.get("/semester/:semester", getCoursesBySemester);
router.get("/instructor/:instructorId", getCoursesByInstructor);
router.get("/program/:program/fee-structure", getProgramFeeStructure);
router.get("/code/:code", getCourseByCode);

// ==================== SINGLE COURSE ROUTES ====================
router.get("/:id", getCourseById);
router.post("/", createCourse);
router.post("/bulk", createBulkCourses);
router.put("/:id", updateCourse);
router.put("/:id/fee", updateCourseFee);
router.patch("/:id/toggle", toggleCourseStatus);
router.delete("/:id", deleteCourse);

// ==================== BULK OPERATIONS ====================
router.post("/bulk/fee", bulkUpdateCourseFees);
router.patch("/bulk/status", bulkUpdateCourseStatus);
router.delete("/bulk", bulkDeleteCourses);

// ==================== COURSE ASSIGNMENT ROUTES ====================
router.post("/:id/assign-instructor", assignInstructor);
router.delete("/:id/instructor", removeInstructor);
router.post("/:id/prerequisites", addPrerequisite);
router.delete("/:id/prerequisites/:prerequisiteId", removePrerequisite);

// ==================== COURSE ENROLLMENT ROUTES ====================
router.post("/:id/enroll", enrollStudent);
router.delete("/:id/drop/:studentId", dropStudent);
router.get("/:id/enrollments", getCourseEnrollments);
router.put("/:id/capacity", updateCourseCapacity);

// ==================== COURSE SCHEDULE ROUTES ====================
router.put("/:id/schedule", updateCourseSchedule);
router.get("/:id/schedule", getCourseSchedule);

// ==================== COURSE MATERIALS ROUTES ====================
router.post("/:id/textbooks", addTextbook);
router.delete("/:id/textbooks/:textbookId", removeTextbook);
router.post("/:id/learning-outcomes", addLearningOutcome);
router.delete("/:id/learning-outcomes/:outcomeId", removeLearningOutcome);

// ==================== COURSE FEE MANAGEMENT ====================
router.get("/:id/fee-breakdown", getCourseFeeBreakdown);
router.post("/:id/fee-waiver", applyFeeWaiver);
router.delete("/:id/fee-waiver", removeFeeWaiver);

export default router;