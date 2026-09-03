import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  createUniversity,
  getUniversity,
  updateUniversity,
  deleteUniversity,
} from "../controllers/university.controller.js";

const router = express.Router();

// Public route
router.get("/", auth,  getUniversity);

// Protected routes (single-university: no :id params)
router.post("/", auth, authorize("Admin"), createUniversity);
router.put("/", auth, authorize("Admin"), updateUniversity);
router.delete("/", auth, authorize("Admin"), deleteUniversity);

export default router;