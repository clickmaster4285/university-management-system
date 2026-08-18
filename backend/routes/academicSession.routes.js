// backend/src/routes/academicSession.routes.js
import express from 'express';
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

// GET /api/academic-sessions
router.get('/', getAcademicSessions);

// GET /api/academic-sessions/current
router.get('/current', getCurrentAcademicSession);

// GET /api/academic-sessions/stats
router.get('/stats', getAcademicSessionStats);

// GET /api/academic-sessions/:id
router.get('/:id', getAcademicSessionById);

// POST /api/academic-sessions
router.post('/', createAcademicSession);

// PUT /api/academic-sessions/:id
router.put('/:id', updateAcademicSession);

// PATCH /api/academic-sessions/:id/set-current
router.patch('/:id/set-current', setCurrentAcademicSession);

// DELETE /api/academic-sessions/:id
router.delete('/:id', deleteAcademicSession);

export default router;