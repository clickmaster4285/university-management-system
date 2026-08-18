// backend/src/routes/semester.routes.js
import express from 'express';
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

// GET /api/semesters
router.get('/', getSemesters);

// GET /api/semesters/stats
router.get('/stats', getSemesterStats);

// GET /api/semesters/session/:sessionId
router.get('/session/:sessionId', getSemestersBySession);

// GET /api/semesters/:id
router.get('/:id', getSemesterById);

// POST /api/semesters
router.post('/', createSemester);

// PUT /api/semesters/:id
router.put('/:id', updateSemester);

// DELETE /api/semesters/:id
router.delete('/:id', deleteSemester);

export default router;