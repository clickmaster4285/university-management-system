import express from 'express';
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
// import auth from '../middleware/auth.js'; // Comment this out for now

const router = express.Router();

// All routes are public for now (remove auth)
router.post('/', createAdmission);
router.get('/', getAllAdmissions);
router.get('/stats/summary', getAdmissionStats);
router.get('/stats/department', getAdmissionStatsByDepartment);
router.get('/recent', getRecentAdmissions);
router.get('/program/:program', getAdmissionsByProgram);
router.get('/by-date', getAdmissionsByDateRange);
router.get('/:id', getAdmissionById);
router.put('/:id', updateAdmission); // Remove auth
router.patch('/:id/status', updateAdmissionStatus); // Remove auth
router.delete('/:id', deleteAdmission); // Remove auth

export default router;