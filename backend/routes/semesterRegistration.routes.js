import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  listSemesterRegistrations,
  getSemesterRegistrationById,
  previewSemesterRegistration,
  createSemesterRegistration,
  dropSemesterRegistration,
  getSemesterRegistrationStats,
} from '../controllers/semesterRegistration.controller.js';

const router = Router();

router.use(auth, authorize('Admin', 'Staff'));

router.get('/stats', getSemesterRegistrationStats);
router.post('/preview', previewSemesterRegistration);
router.get('/', listSemesterRegistrations);
router.get('/:id', getSemesterRegistrationById);
router.post('/', createSemesterRegistration);
router.patch('/:id/drop', dropSemesterRegistration);

export default router;
