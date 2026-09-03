import { Router } from 'express';
import {
  getPublicCampuses,
  getPublicPrograms,
  getPublicSessions,
  submitPublicApplication,
  trackPublicApplication,
} from '../controllers/publicCatalog.controller.js';
import { publicApplyLimiter, publicTrackLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/catalog/programs', getPublicPrograms);
router.get('/catalog/campuses', getPublicCampuses);
router.get('/catalog/sessions', getPublicSessions);
router.post('/applications', publicApplyLimiter, submitPublicApplication);
router.get('/applications/track', publicTrackLimiter, trackPublicApplication);

export default router;
