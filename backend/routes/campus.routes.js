import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  createCampus,
  getCampuses,
  getCampusById,
  updateCampus,
  deleteCampus,
} from "../controllers/campus.controller.js";

const router = express.Router();

// Protected routes (all campus actions require an authenticated Admin)
router.post("/", auth, authorize("Admin"), createCampus);
router.get("/", auth, authorize("Admin"), getCampuses);
router.get("/:id", auth, authorize("Admin"), getCampusById);
router.put("/:id", auth, authorize("Admin"), updateCampus);
router.delete("/:id", auth, authorize("Admin"), deleteCampus);

export default router;