import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { attachUserScopes } from '../middleware/scopes.js';
import {
  getOfferings,
  getOfferingStats,
  getOfferingById,
  createOffering,
  updateOffering,
  deleteOffering,
  getOfferingEnrollments,
  enrollStudentInOffering,
  dropStudentFromOffering,
} from '../controllers/courseOffering.controller.js';

const router = Router();

router.use(auth);

router.get('/', attachUserScopes, getOfferings);
router.get('/stats', getOfferingStats);
router.post('/', authorize('Admin'), createOffering);
router.get('/:id', getOfferingById);
router.put('/:id', authorize('Admin'), updateOffering);
router.delete('/:id', authorize('Admin'), deleteOffering);

router.get('/:id/enrollments', getOfferingEnrollments);
router.post('/:id/enroll', enrollStudentInOffering);
router.delete('/:id/enroll/:studentId', dropStudentFromOffering);

export default router;
