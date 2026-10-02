import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireStudentPortal } from '../middleware/requireStudentPortal.js';
import {
  getMyChallans,
  getMyProfile,
  getMyRegistrations,
} from '../controllers/studentPortal.controller.js';

const router = Router();

router.use(auth, requireStudentPortal);

router.get('/me', getMyProfile);
router.get('/registrations', getMyRegistrations);
router.get('/challans', getMyChallans);

export default router;
