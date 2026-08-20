import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  getFinanceData,
  getFinanceSummary,
  updateMonthlyData,
  addInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  updateBudgetAllocation
} from '../controllers/finance.controller.js';

const router = express.Router();

router.use(auth, authorize("Admin"));

router.get('/', getFinanceData);
router.get('/summary', getFinanceSummary);
router.put('/monthly', updateMonthlyData);
router.post('/invoices', addInvoice);
router.put('/invoices/:invoiceId', updateInvoiceStatus);
router.delete('/invoices/:invoiceId', deleteInvoice);
router.put('/budget', updateBudgetAllocation);

export default router;