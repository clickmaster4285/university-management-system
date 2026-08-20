// backend/src/routes/batch.routes.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getBatches,
  getBatchById,
  getBatchStats,
  createBatch,
  updateBatch,
  deleteBatch
} from '../controllers/batch.controller.js';

const router = express.Router();

router.use(auth);

router.get('/', getBatches);
router.get('/stats', getBatchStats);
router.get('/:id', getBatchById);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

export default router;