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

const router = Router();

router.post('/', auth, authorize('Admin'), createSubject);
router.get('/', auth, authorize('Admin'), getSubjects);
router.get('/stats', auth, authorize('Admin'), getSubjectStats);
router.get('/:id', auth, authorize('Admin'), getSubjectById);
router.put('/:id', auth, authorize('Admin'), updateSubject);
router.delete('/:id', auth, authorize('Admin'), deleteSubject);

export default router;
