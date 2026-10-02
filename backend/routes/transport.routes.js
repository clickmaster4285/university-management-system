import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getTransportStats
} from '../controllers/transport.controller.js';

const router = express.Router();

router.use(auth);

// Statistics
router.get('/stats/summary', getTransportStats);

// Bus routes
router.get('/buses', getAllBuses);
router.get('/buses/:id', getBusById);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Driver routes
router.get('/drivers', getAllDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Route routes
router.get('/routes', getAllRoutes);
router.post('/routes', createRoute);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);

export default router;