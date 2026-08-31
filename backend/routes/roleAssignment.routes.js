import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import {
  createRoleAssignment,
  deleteRoleAssignment,
  getRoleAssignmentMeta,
  listRoleAssignments,
} from '../controllers/roleAssignment.controller.js';

const router = Router();

router.use(auth, authorize('Admin', 'Staff'));

router.get('/meta', getRoleAssignmentMeta);
router.get('/', listRoleAssignments);
router.post('/', authorize('Admin'), createRoleAssignment);
router.delete('/:id', authorize('Admin'), deleteRoleAssignment);

export default router;
