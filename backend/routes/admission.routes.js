import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createInternalApplication,
  deleteApplication,
  getApplicationById,
  getApplicationStats,
  listApplications,
  promoteApplication,
  updateApplicationStatus,
} from '../controllers/studentApplication.controller.js';
import {
  completeAdmission,
  getDossierById,
  getDossierDocumentTypes,
  listDossiers,
  updateDossier,
} from '../controllers/studentAdmission.controller.js';
import {
  deleteDossierDocument,
  deleteStudentDocument,
  downloadDossierDocument,
  downloadStudentDocument,
  listDossierDocuments,
  listStudentDocuments,
  resolveDossierForUpload,
  resolveStudentForUpload,
  uploadDossierDocument,
  uploadStudentDocument,
} from '../controllers/studentDocument.controller.js';
import { studentDocumentUpload } from '../middleware/upload.js';

const router = express.Router();

router.use(auth);

// New student application pipeline
router.get('/applications/stats', getApplicationStats);
router.get('/applications', listApplications);
router.post('/applications', createInternalApplication);
router.get('/applications/:id', getApplicationById);
router.patch('/applications/:id/status', updateApplicationStatus);
router.post('/applications/:id/promote', promoteApplication);
router.delete('/applications/:id', deleteApplication);

// Admission dossiers
router.get('/dossiers/document-types', getDossierDocumentTypes);
router.get('/dossiers', listDossiers);
router.get('/dossiers/:id', getDossierById);
router.put('/dossiers/:id', updateDossier);
router.post('/dossiers/:id/complete', completeAdmission);
router.get('/dossiers/:id/documents', listDossierDocuments);
router.post(
  '/dossiers/:id/documents',
  resolveDossierForUpload,
  studentDocumentUpload.single('file'),
  uploadDossierDocument
);
router.get('/dossiers/:id/documents/:documentId/download', downloadDossierDocument);
router.delete('/dossiers/:id/documents/:documentId', deleteDossierDocument);

export {
  listStudentDocuments,
  uploadStudentDocument,
  deleteStudentDocument,
  downloadStudentDocument,
  resolveStudentForUpload,
};

export default router;
