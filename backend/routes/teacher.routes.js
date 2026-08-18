import { Router } from "express";
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

// GET routes
router.get("/", getTeachers);
router.get("/stats", getTeacherStats);
router.get("/:id", getTeacherById);

// POST routes
router.post("/", createTeacher);
router.post("/bulk", bulkCreateTeachers);

// PUT routes
router.put("/:id", updateTeacher);

// DELETE routes
router.delete("/:id", deleteTeacher);

export default router;