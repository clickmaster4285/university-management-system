// backend/src/routes/academicSession.routes.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAcademicSessions,
  getAcademicSessionById,
  getCurrentAcademicSession,
  getAcademicSessionStats,
  createAcademicSession,
  updateAcademicSession,
  setCurrentAcademicSession,
  deleteAcademicSession
} from '../controllers/academicSession.controller.js';

const router = express.Router();

router.use(auth);

router.get('/', getAcademicSessions);
router.get('/current', getCurrentAcademicSession);
router.get('/stats', getAcademicSessionStats);
router.get('/:id', getAcademicSessionById);
router.post('/', createAcademicSession);
router.put('/:id', updateAcademicSession);
router.patch('/:id/set-current', setCurrentAcademicSession);
router.delete('/:id', deleteAcademicSession);

export default router;