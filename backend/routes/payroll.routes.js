import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { requireModule } from '../middleware/requireModule.js';
import { listAllPayrolls } from '../controllers/staffPayroll.controller.js';

const router = Router();

router.use(auth, requireModule('finance'), authorize('Admin', 'Staff'));

router.get('/', listAllPayrolls);

export default router;
