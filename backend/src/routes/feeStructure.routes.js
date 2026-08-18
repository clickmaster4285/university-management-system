// backend/src/routes/feeStructure.routes.js
import express from 'express';
import {
  getAllFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeStructureByProgram
} from '../controllers/feeStructure.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all fee structures
router.get('/', getAllFeeStructures);

// Get fee structure by program and semester
router.get('/program/:program/semester/:semester', getFeeStructureByProgram);

// Get fee structure by ID
router.get('/:id', getFeeStructureById);

// Create fee structure
router.post('/', createFeeStructure);

// Update fee structure
router.put('/:id', updateFeeStructure);

// Delete fee structure (soft delete)
router.delete('/:id', deleteFeeStructure);

export default router;