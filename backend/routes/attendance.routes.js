import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getAttendance,
  getAttendanceById,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getStudentsForAttendance,
  getStudentAttendanceHistory
} from "../controllers/attendance.controller.js";

const router = Router();

router.use(auth);

// Routes without ID
router.get("/", getAttendance);
router.get("/stats", getAttendanceStats);
router.get("/students", getStudentsForAttendance);
router.post("/mark", markAttendance);

// Routes with studentId
router.get("/student/:studentId", getStudentAttendanceHistory);

// Routes with ID
router.get("/:id", getAttendanceById);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;