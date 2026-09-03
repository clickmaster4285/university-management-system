import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  createStaffLeave,
  deleteStaffLeave,
  getStaffLeaveBalance,
  getStaffLeaveStats,
  listStaffLeaves,
  updateStaffLeaveBalance,
  updateStaffLeaveStatus,
} from '../controllers/staffLeave.controller.js';
import {
  bulkMarkStaffAttendance,
  getStaffAttendanceStats,
  listStaffAttendance,
  markStaffAttendance,
} from '../controllers/staffAttendance.controller.js';
import {
  addRecruitmentApplicant,
  createRecruitment,
  deleteRecruitment,
  getRecruitmentById,
  getRecruitmentStats,
  hireApplicant,
  listRecruitments,
  updateApplicantStatus,
  updateRecruitment,
} from '../controllers/recruitment.controller.js';

const router = Router();

router.use(auth);

router.get('/leaves/stats', authorize('Admin', 'Staff'), getStaffLeaveStats);
router.get('/leaves/balance/:staffMemberId', authorize('Admin', 'Staff'), getStaffLeaveBalance);
router.put('/leaves/balance/:staffMemberId', authorize('Admin'), updateStaffLeaveBalance);
router.get('/leaves', authorize('Admin', 'Staff'), listStaffLeaves);
router.post('/leaves', authorize('Admin', 'Staff'), createStaffLeave);
router.put('/leaves/:id/status', authorize('Admin'), updateStaffLeaveStatus);
router.delete('/leaves/:id', authorize('Admin'), deleteStaffLeave);

router.get('/attendance/stats', authorize('Admin', 'Staff'), getStaffAttendanceStats);
router.get('/attendance', authorize('Admin', 'Staff'), listStaffAttendance);
router.post('/attendance', authorize('Admin', 'Staff'), markStaffAttendance);
router.post('/attendance/bulk', authorize('Admin', 'Staff'), bulkMarkStaffAttendance);

router.get('/recruitment/stats', authorize('Admin', 'Staff'), getRecruitmentStats);
router.get('/recruitment', authorize('Admin', 'Staff'), listRecruitments);
router.post('/recruitment', authorize('Admin'), createRecruitment);
router.get('/recruitment/:id', authorize('Admin', 'Staff'), getRecruitmentById);
router.put('/recruitment/:id', authorize('Admin'), updateRecruitment);
router.delete('/recruitment/:id', authorize('Admin'), deleteRecruitment);
router.post('/recruitment/:id/applicants', authorize('Admin', 'Staff'), addRecruitmentApplicant);
router.put(
  '/recruitment/:id/applicants/:applicantId/status',
  authorize('Admin'),
  updateApplicantStatus
);
router.post(
  '/recruitment/:id/applicants/:applicantId/hire',
  authorize('Admin'),
  hireApplicant
);

export default router;
