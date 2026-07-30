import express from 'express';
import {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamStats,
  addGrades,
  getGrades,
  updateGrade
} from '../controllers/exam.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllExams);
router.get('/stats/summary', getExamStats);
router.get('/:id', getExamById);

// Protected routes
router.post('/', auth, createExam);
router.put('/:id', auth, updateExam);
router.delete('/:id', auth, deleteExam);

// Grade routes
router.post('/:id/grades', auth, addGrades);
router.get('/:id/grades', getGrades);
router.put('/:id/grades/:studentId', auth, updateGrade);

export default router;