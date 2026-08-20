import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  bulkCreateTeachers,
  getTeacherStats
} from "../controllers/teacher.controller.js";

const router = Router();

router.use(auth);

router.get("/", getTeachers);
router.get("/stats", getTeacherStats);
router.get("/:id", getTeacherById);
router.post("/", createTeacher);
router.post("/bulk", bulkCreateTeachers);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

export default router;