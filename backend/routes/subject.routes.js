import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectStats,
} from '../controllers/subject.controller.js';
import {
  getSubjectFees,
  getCurrentSubjectFee,
  addSubjectFee,
} from '../controllers/subjectFeeHistory.controller.js';

const router = Router();

router.post('/', auth, authorize('Admin'), createSubject);
router.get('/', auth, authorize('Admin'), getSubjects);
router.get('/stats', auth, authorize('Admin'), getSubjectStats);

router.get('/:id/fees/current', auth, authorize('Admin'), getCurrentSubjectFee);
router.get('/:id/fees', auth, authorize('Admin'), getSubjectFees);
router.post('/:id/fees', auth, authorize('Admin'), addSubjectFee);

router.get('/:id', auth, authorize('Admin'), getSubjectById);
router.put('/:id', auth, authorize('Admin'), updateSubject);
router.delete('/:id', auth, authorize('Admin'), deleteSubject);

export default router;
