import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { requireModule } from '../middleware/requireModule.js';
import {
  applyRoleToUsers,
  createPlatformRole,
  deletePlatformRole,
  getPlatformRoleById,
  getPlatformRoleMeta,
  listPlatformRoles,
  reseedPlatformRoles,
  updatePlatformRole,
} from '../controllers/platformRole.controller.js';

const router = Router();

router.use(auth, authorize('Admin'), requireModule('settings'));

router.get('/meta', getPlatformRoleMeta);
router.get('/', listPlatformRoles);
router.post('/', createPlatformRole);
router.post('/reseed', reseedPlatformRoles);
router.get('/:id', getPlatformRoleById);
router.put('/:id', updatePlatformRole);
router.delete('/:id', deletePlatformRole);
router.post('/:id/apply-to-users', applyRoleToUsers);

export default router;
