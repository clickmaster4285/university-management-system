// backend/src/routes/batch.routes.js
import express from 'express';
import {
  getBatches,
  getBatchById,
  getBatchStats,
  createBatch,
  updateBatch,
  deleteBatch
} from '../controllers/batch.controller.js';

const router = express.Router();

// GET /api/batches
router.get('/', getBatches);

// GET /api/batches/stats
router.get('/stats', getBatchStats);

// GET /api/batches/:id
router.get('/:id', getBatchById);

// POST /api/batches
router.post('/', createBatch);

// PUT /api/batches/:id
router.put('/:id', updateBatch);

// DELETE /api/batches/:id
router.delete('/:id', deleteBatch);

export default router;