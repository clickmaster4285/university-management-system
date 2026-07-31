
import express from 'express';
import {
  getAllFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
  getFeeStats,
  processPayment,
  generateInvoice,
  applyLateFees
} from '../controllers/fee.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllFees);
router.get('/stats/summary', getFeeStats);
router.get('/:id', getFeeById);

// Protected routes
router.post('/', auth, createFee);
router.put('/:id', auth, updateFee);
router.delete('/:id', auth, deleteFee);

// Payment routes
router.post('/:id/pay', auth, processPayment);
router.post('/:id/invoice', auth, generateInvoice);
router.post('/apply-late-fees', auth, applyLateFees);

export default router;