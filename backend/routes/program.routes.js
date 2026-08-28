import { Router } from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStats,
} from "../controllers/program.controller.js";

const router = Router();

router.post("/", auth, authorize("Admin"), createProgram);
router.get("/", auth, authorize("Admin"), getPrograms);
router.get("/stats", auth, authorize("Admin"), getProgramStats);
router.get("/:id", auth, authorize("Admin"), getProgramById);
router.put("/:id", auth, authorize("Admin"), updateProgram);
router.delete("/:id", auth, authorize("Admin"), deleteProgram);

export default router;
