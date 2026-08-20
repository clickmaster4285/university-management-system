// backend/src/routes/semester.routes.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getSemesters,
  getSemesterById,
  getSemestersBySession,
  getSemesterStats,
  createSemester,
  updateSemester,
  deleteSemester
} from '../controllers/semester.controller.js';

const router = express.Router();

router.use(auth);

router.get('/', getSemesters);
router.get('/stats', getSemesterStats);
router.get('/session/:sessionId', getSemestersBySession);
router.get('/:id', getSemesterById);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.delete('/:id', deleteSemester);

export default router;