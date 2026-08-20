import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  createCampus,
  getCampuses,
  getCampusById,
  updateCampus,
  deleteCampus,
  setMainCampus,
} from "../controllers/campus.controller.js";

const router = express.Router();

// Protected routes (all campus actions require an authenticated Admin or Super Admin)
router.post("/", auth, authorize("Super Admin", "Admin"), createCampus);
router.get("/", auth, authorize("Super Admin", "Admin"), getCampuses);
router.get("/:id", auth, authorize("Super Admin", "Admin"), getCampusById);
router.put("/:id", auth, authorize("Super Admin", "Admin"), updateCampus);
router.delete("/:id", auth, authorize("Super Admin", "Admin"), deleteCampus);
router.put("/:id/set-main", auth, authorize("Super Admin", "Admin"), setMainCampus);

export default router;