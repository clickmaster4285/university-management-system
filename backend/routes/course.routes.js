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
  createBulkCourses,
  bulkUpdateCourseStatus,
  bulkDeleteCourses,
  enrollStudent,
  dropStudent,
  checkSeeded,
  seedAllCourses,
} from "../controllers/course.controller.js";

const router = Router();

router.use(auth);

// Dev / seed (optional)
router.get("/seeded", checkSeeded);
router.post("/seed", authorize("Admin"), seedAllCourses);

// Core CRUD — same shape as Program / Department
router.get("/", getCourses);
router.get("/stats", getCourseStats);
router.post("/", authorize("Admin"), createCourse);
router.post("/bulk", authorize("Admin"), createBulkCourses);
router.patch("/bulk", authorize("Admin"), bulkUpdateCourseStatus);
router.delete("/bulk", authorize("Admin"), bulkDeleteCourses);

router.get("/:id", getCourseById);
router.put("/:id", authorize("Admin"), updateCourse);
router.delete("/:id", authorize("Admin"), deleteCourse);

// Enrollment (kept separate — different actors / workflow later)
router.post("/:id/enroll", enrollStudent);
router.delete("/:id/enroll/:studentId", dropStudent);

export default router;
