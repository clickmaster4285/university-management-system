import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  createFaculty,
  getFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  getFacultyStats,
} from "../controllers/faculty.controller.js";

const router = express.Router();

// Protected routes (all faculty actions require an authenticated Admin)
router.post("/", auth, authorize("Admin"), createFaculty);
router.get("/", auth, authorize("Admin"), getFaculties);
router.get("/stats", auth, authorize("Admin"), getFacultyStats);
router.get("/:id", auth, authorize("Admin"), getFacultyById);
router.put("/:id", auth, authorize("Admin"), updateFaculty);
router.delete("/:id", auth, authorize("Admin"), deleteFaculty);

export default router;
