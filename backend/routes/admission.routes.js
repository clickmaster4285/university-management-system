import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  updateAdmissionStatus,
  deleteAdmission,
  getAdmissionStats,
  getAdmissionsByProgram,
  getAdmissionsByDateRange,
  getAdmissionStatsByDepartment,
  getRecentAdmissions
} from '../controllers/admission.controller.js';

const router = express.Router();

router.use(auth);

router.post('/', createAdmission);
router.get('/', getAllAdmissions);
router.get('/stats/summary', getAdmissionStats);
router.get('/stats/department', getAdmissionStatsByDepartment);
router.get('/recent', getRecentAdmissions);
router.get('/program/:program', getAdmissionsByProgram);
router.get('/by-date', getAdmissionsByDateRange);
router.get('/:id', getAdmissionById);
router.put('/:id', updateAdmission);
router.patch('/:id/status', updateAdmissionStatus);
router.delete('/:id', deleteAdmission);

export default router;