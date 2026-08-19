import express from "express";
import auth from "../middleware/auth.js";
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
router.get("/", auth, getUniversities);
router.get("/:id", auth, getUniversityById);
router.get("/code/:code", auth, getUniversityByCode);
router.get("/:id/stats", auth, getUniversityStats);
router.put("/:id", auth, updateUniversity);
router.delete("/:id", auth, deleteUniversity);

export default router;