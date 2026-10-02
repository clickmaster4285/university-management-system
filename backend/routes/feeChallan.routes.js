import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  listChallans,
  getChallanById,
  getChallanStats,
  recordChallanPayment,
} from '../controllers/feeChallan.controller.js';

const router = Router();

router.use(auth, authorize('Admin', 'Staff'));

router.get('/stats', getChallanStats);
router.get('/', listChallans);
router.get('/:id', getChallanById);
router.post('/:id/payments', recordChallanPayment);

export default router;
