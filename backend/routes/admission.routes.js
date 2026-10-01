import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createInternalApplication,
  deleteApplication,
  getApplicationAdmissionFee,
  getApplicationById,
  getApplicationStats,
  listApplications,
  promoteApplication,
  updateApplicationStatus,
  verifyApplicationAdmissionFee,
} from '../controllers/studentApplication.controller.js';
import {
  completeAdmission,
  getDossierAdmissionFee,
  getDossierById,
  getDossierDocumentTypes,
  listDossiers,
  updateDossier,
  verifyDossierAdmissionFee,
} from '../controllers/studentAdmission.controller.js';
import {
  deleteApplicationDocument,
  deleteDossierDocument,
  deleteStudentDocument,
  downloadApplicationDocument,
  downloadDossierDocument,
  downloadStudentDocument,
  listApplicationDocuments,
  listDossierDocuments,
  listStudentDocuments,
  resolveApplicationForUpload,
  resolveDossierForUpload,
  resolveStudentForUpload,
  reviewApplicationDocument,
  reviewDossierDocument,
  uploadApplicationDocument,
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
router.get('/applications/:id/admission-fee', getApplicationAdmissionFee);
router.post('/applications/:id/admission-fee/verify', verifyApplicationAdmissionFee);
router.delete('/applications/:id', deleteApplication);
router.get('/applications/:id/documents', listApplicationDocuments);
router.post(
  '/applications/:id/documents',
  resolveApplicationForUpload,
  studentDocumentUpload.single('file'),
  uploadApplicationDocument
);
router.get('/applications/:id/documents/:documentId/download', downloadApplicationDocument);
router.patch('/applications/:id/documents/:documentId/review', reviewApplicationDocument);
router.delete('/applications/:id/documents/:documentId', deleteApplicationDocument);

// Admission dossiers
router.get('/dossiers/document-types', getDossierDocumentTypes);
router.get('/dossiers', listDossiers);
router.get('/dossiers/:id', getDossierById);
router.put('/dossiers/:id', updateDossier);
router.get('/dossiers/:id/admission-fee', getDossierAdmissionFee);
router.post('/dossiers/:id/admission-fee/verify', verifyDossierAdmissionFee);
router.post('/dossiers/:id/complete', completeAdmission);
router.get('/dossiers/:id/documents', listDossierDocuments);
router.post(
  '/dossiers/:id/documents',
  resolveDossierForUpload,
  studentDocumentUpload.single('file'),
  uploadDossierDocument
);
router.get('/dossiers/:id/documents/:documentId/download', downloadDossierDocument);
router.patch('/dossiers/:id/documents/:documentId/review', reviewDossierDocument);
router.delete('/dossiers/:id/documents/:documentId', deleteDossierDocument);

export {
  listStudentDocuments,
  uploadStudentDocument,
  deleteStudentDocument,
  downloadStudentDocument,
  resolveStudentForUpload,
};

export default router;
