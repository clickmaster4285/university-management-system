import { Router } from "express";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats
} from "../controllers/department.controller.js";

const router = Router();

router.get("/", getDepartments);
router.get("/stats", getDepartmentStats);
router.get("/:id", getDepartmentById);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;