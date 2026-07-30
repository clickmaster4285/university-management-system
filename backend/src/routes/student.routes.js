import { Router } from "express";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentStats
} from "../controllers/student.controller.js";

const router = Router();

// GET routes
router.get("/", getStudents);
router.get("/stats", getStudentStats);
router.get("/:id", getStudentById);

// POST routes
router.post("/", createStudent);
router.post("/bulk", bulkCreateStudents);

// PUT routes
router.put("/:id", updateStudent);

// DELETE routes
router.delete("/:id", deleteStudent);

export default router;