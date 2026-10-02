import express from 'express';
import { auth } from '../middleware/auth.js';
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

const router = express.Router();

router.use(auth);

router.get('/', getAllExams);
router.get('/stats/summary', getExamStats);
router.get('/:id', getExamById);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

// Grade routes
router.post('/:id/grades', addGrades);
router.get('/:id/grades', getGrades);
router.put('/:id/grades/:studentId', updateGrade);

export default router;