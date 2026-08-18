import express from "express";
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
router.get("/", getUniversities);
router.get("/:id", getUniversityById);
router.get("/code/:code", getUniversityByCode);
router.get("/:id/stats", getUniversityStats);
router.put("/:id", updateUniversity);
router.delete("/:id", deleteUniversity);

export default router;