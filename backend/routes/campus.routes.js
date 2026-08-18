import express from "express";
import {
  createCampus,
  getCampuses,
  getCampusById,
  updateCampus,
  deleteCampus,
  setMainCampus,
} from "../controllers/campus.controller.js";

const router = express.Router();

router.post("/", createCampus);
router.get("/", getCampuses);
router.get("/:id", getCampusById);
router.put("/:id", updateCampus);
router.delete("/:id", deleteCampus);
router.put("/:id/set-main", setMainCampus);

export default router;