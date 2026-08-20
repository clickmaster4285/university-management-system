import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  getAssignmentsByCourse
} from '../controllers/assignment.controller.js';

const router = express.Router();

router.use(auth);

router.get('/', getAllAssignments);
router.get('/stats/summary', getAssignmentStats);
router.get('/course/:courseCode', getAssignmentsByCourse);
router.get('/:id', getAssignmentById);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

export default router;