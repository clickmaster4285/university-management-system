import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  createUniversity,
  getUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  getUniversityByCode,
  getUniversityStats,
  checkUniversityCode,
} from "../controllers/university.controller.js";

const router = express.Router();

// Public routes
router.post("/", createUniversity);
router.get("/check-code/:code", checkUniversityCode);

// Protected routes
router.get("/", auth, authorize("Super Admin"), getUniversities);
router.get("/code/:code", auth, authorize("Super Admin", "Admin"), getUniversityByCode);
router.get("/:id", auth, authorize("Super Admin", "Admin"), getUniversityById);
router.get("/:id/stats", auth, authorize("Super Admin", "Admin"), getUniversityStats);
router.put("/:id", auth, authorize("Super Admin", "Admin"), updateUniversity);
router.delete("/:id", auth, authorize("Super Admin"), deleteUniversity);

export default router;