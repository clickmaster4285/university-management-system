import { Router } from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStats
} from "../controllers/course.controller.js";

const router = Router();

router.get("/", getCourses);
router.get("/stats", getCourseStats);
router.get("/:id", getCourseById);
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;