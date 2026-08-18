// backend/src/routes/notification.routes.js
import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';

const router = express.Router();

// ✅ Specific routes first
router.get('/status', notificationController.getEmailStatus);
router.get('/stats', notificationController.getNotificationStats);
router.post('/test-email', notificationController.sendTestEmail);
router.put('/mark-all-read', notificationController.markAllAsRead);

// ✅ CRUD routes
router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById);
router.post('/', notificationController.createNotification);
router.put('/:id', notificationController.updateNotification);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;