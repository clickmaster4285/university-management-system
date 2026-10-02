import { Router } from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
} from "../controllers/department.controller.js";

const router = Router();

router.post("/", auth, authorize("Admin"), createDepartment);
router.get("/", auth, authorize("Admin"), getDepartments);
router.get("/stats", auth, authorize("Admin"), getDepartmentStats);
router.get("/:id", auth, authorize("Admin"), getDepartmentById);
router.put("/:id", auth, authorize("Admin"), updateDepartment);
router.delete("/:id", auth, authorize("Admin"), deleteDepartment);

export default router;
