// backend/src/routes/feeStructure.routes.js
import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  getAllFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeStructureByProgram
} from '../controllers/feeStructure.controller.js';

const router = express.Router();

router.use(auth, authorize("Admin", "Staff"));

router.get('/', getAllFeeStructures);
router.get('/program/:program/semester/:semester', getFeeStructureByProgram);
router.get('/:id', getFeeStructureById);
router.post('/', createFeeStructure);
router.put('/:id', updateFeeStructure);
router.delete('/:id', deleteFeeStructure);

export default router;