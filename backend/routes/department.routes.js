// backend/src/routes/department.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats
} from "../controllers/department.controller.js";

const router = Router();

router.use(auth);

router.get("/", getDepartments);
router.get("/stats", getDepartmentStats);
router.get("/:id", getDepartmentById);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;