import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  listProgramSemesterFeeSchedules,
  getProgramSemesterFeeScheduleById,
  generateProgramSemesterFeeSchedules,
  updateProgramSemesterFeeSchedule,
  activateProgramSemesterFeeSchedule,
  archiveProgramSemesterFeeSchedule,
  deleteProgramSemesterFeeSchedule,
  refreshProgramSemesterFeeScheduleRates,
  getProgramSemesterFeeScheduleStats,
} from '../controllers/programSemesterFeeSchedule.controller.js';

const router = Router();

router.use(auth, authorize('Admin', 'Staff'));

router.get('/', listProgramSemesterFeeSchedules);
router.get('/:id', getProgramSemesterFeeScheduleById);
router.put('/:id', updateProgramSemesterFeeSchedule);
router.patch('/:id/refresh-rates', refreshProgramSemesterFeeScheduleRates);
router.patch('/:id/activate', activateProgramSemesterFeeSchedule);
router.patch('/:id/archive', archiveProgramSemesterFeeSchedule);
router.delete('/:id', deleteProgramSemesterFeeSchedule);

export default router;
