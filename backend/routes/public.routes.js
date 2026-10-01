import { Router } from 'express';
import {
  getPublicCatalog,
  getPublicCampuses,
  getPublicPrograms,
  getPublicSessions,
  submitPublicApplication,
  trackPublicApplication,
  updatePublicApplication,
} from '../controllers/publicCatalog.controller.js';
import {
  listApplicationDocuments,
  resolveApplicationForUpload,
  uploadApplicationDocument,
} from '../controllers/studentDocument.controller.js';
import { studentDocumentUpload } from '../middleware/upload.js';
import { publicApplyLimiter, publicTrackLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/catalog', getPublicCatalog);
router.get('/catalog/programs', getPublicPrograms);
router.get('/catalog/campuses', getPublicCampuses);
router.get('/catalog/sessions', getPublicSessions);
router.post('/applications', publicApplyLimiter, submitPublicApplication);
router.get('/applications/track', publicTrackLimiter, trackPublicApplication);
router.put('/applications/:id', publicApplyLimiter, updatePublicApplication);
router.get('/applications/:id/documents', publicTrackLimiter, listApplicationDocuments);
router.post(
  '/applications/:id/documents',
  publicApplyLimiter,
  resolveApplicationForUpload,
  studentDocumentUpload.single('file'),
  uploadApplicationDocument
);

export default router;
