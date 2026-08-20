import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
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

const router = express.Router();

router.use(auth, authorize("Admin", "Staff"));

router.get('/', getAllFees);
router.get('/stats/summary', getFeeStats);
router.get('/:id', getFeeById);
router.post('/', createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

// Payment routes
router.post('/:id/pay', processPayment);
router.post('/:id/invoice', generateInvoice);
router.post('/apply-late-fees', applyLateFees);

export default router;