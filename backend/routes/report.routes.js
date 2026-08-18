// backend/src/routes/report.routes.js
import express from 'express';
import * as reportController from '../controllers/report.controller.js'; // Keep .js extension for import

const router = express.Router();

// ==================== REPORT ROUTES ====================
router.get('/', reportController.getAllReports);
router.get('/stats', reportController.getReportStats);
router.get('/categories', reportController.getReportCategories);
router.get('/:id', reportController.getReportById);
router.post('/generate', reportController.generateReport);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);
router.get('/:id/export/csv', reportController.exportCSV);

export default router;