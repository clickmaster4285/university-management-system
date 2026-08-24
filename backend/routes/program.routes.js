import { Router } from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStats
} from "../controllers/program.controller.js";

const router = Router();

router.use(auth);

router.get("/", getPrograms);
router.get("/stats", getProgramStats);
router.get("/:id", getProgramById);
router.post("/", authorize("Admin"), createProgram);
router.put("/:id", authorize("Admin"), updateProgram);
router.delete("/:id", authorize("Admin"), deleteProgram);

export default router;
