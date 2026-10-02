import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  listCampusVisits,
  createCampusVisit,
  updateCampusVisit,
  deleteCampusVisit,
} from '../controllers/campusVisit.controller.js';

const router = Router();

router.use(auth);
router.use(authorize('Admin', 'Staff'));

router.get('/', listCampusVisits);
router.post('/', createCampusVisit);
router.put('/:id', updateCampusVisit);
router.delete('/:id', deleteCampusVisit);

export default router;
