import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { requireModule } from '../middleware/requireModule.js';
import {
  createStaffMember,
  deleteStaffMember,
  disableStaffLogin,
  enableStaffLogin,
  getPlatformRoles,
  getStaffMemberById,
  getStaffMembers,
  getStaffStats,
  updateStaffLoginAccess,
  updateStaffMember,
} from '../controllers/staffMember.controller.js';
import {
  createStaffPayroll,
  deleteStaffPayroll,
  getStaffPayrolls,
  updateStaffPayroll,
} from '../controllers/staffPayroll.controller.js';

const router = Router();

router.use(auth, requireModule('staff'));

router.get('/roles', authorize('Admin', 'Staff'), getPlatformRoles);
router.get('/stats', authorize('Admin', 'Staff'), getStaffStats);
router.get('/', authorize('Admin', 'Staff'), getStaffMembers);
router.get('/:id', authorize('Admin', 'Staff'), getStaffMemberById);
router.post('/', authorize('Admin'), createStaffMember);
router.put('/:id', authorize('Admin'), updateStaffMember);
router.delete('/:id', authorize('Admin'), deleteStaffMember);
router.post('/:id/enable-login', authorize('Admin'), enableStaffLogin);
router.put('/:id/login-access', authorize('Admin'), updateStaffLoginAccess);
router.post('/:id/disable-login', authorize('Admin'), disableStaffLogin);

router.get('/:id/payroll', authorize('Admin', 'Staff'), getStaffPayrolls);
router.post('/:id/payroll', authorize('Admin'), createStaffPayroll);
router.put('/:id/payroll/:payrollId', authorize('Admin'), updateStaffPayroll);
router.delete('/:id/payroll/:payrollId', authorize('Admin'), deleteStaffPayroll);

export default router;
