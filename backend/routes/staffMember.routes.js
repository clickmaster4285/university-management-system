import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  createStaffMember,
  deleteStaffMember,
  disableStaffLogin,
  enableStaffLogin,
  getPlatformRoles,
  getStaffMemberById,
  getStaffMembers,
  getStaffStats,
  updateStaffMember,
} from '../controllers/staffMember.controller.js';

const router = Router();

router.use(auth);

router.get('/roles', authorize('Admin', 'Staff'), getPlatformRoles);
router.get('/stats', authorize('Admin', 'Staff'), getStaffStats);
router.get('/', authorize('Admin', 'Staff'), getStaffMembers);
router.get('/:id', authorize('Admin', 'Staff'), getStaffMemberById);
router.post('/', authorize('Admin'), createStaffMember);
router.put('/:id', authorize('Admin'), updateStaffMember);
router.delete('/:id', authorize('Admin'), deleteStaffMember);
router.post('/:id/enable-login', authorize('Admin'), enableStaffLogin);
router.post('/:id/disable-login', authorize('Admin'), disableStaffLogin);

export default router;
