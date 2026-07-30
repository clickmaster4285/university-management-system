import express from 'express';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  getAssignmentsByCourse
} from '../controllers/assignment.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required for viewing and creating)
router.get('/', getAllAssignments);
router.get('/stats/summary', getAssignmentStats);
router.get('/course/:courseCode', getAssignmentsByCourse);
router.get('/:id', getAssignmentById);
router.post('/', createAssignment); // Make create public

// Protected routes (auth required for modifications)
router.put('/:id', auth, updateAssignment);
router.delete('/:id', auth, deleteAssignment);

export default router;