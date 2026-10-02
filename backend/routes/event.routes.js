import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  registerForEvent
} from '../controllers/event.controller.js';

const router = express.Router();

router.use(auth);

router.get('/', getAllEvents);
router.get('/stats/summary', getEventStats);
router.get('/:id', getEventById);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/register', registerForEvent);

export default router;