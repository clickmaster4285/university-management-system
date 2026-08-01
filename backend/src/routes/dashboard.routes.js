// backend/src/routes/dashboard.routes.js
import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/stats', dashboardController.getDashboardStats);
router.get('/activities', dashboardController.getRecentActivities);
router.get('/overview', dashboardController.getDashboardOverview);

export default router;