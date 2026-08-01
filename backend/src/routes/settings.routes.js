// backend/src/routes/settings.routes.js
import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';

const router = express.Router();

// ==================== SETTINGS ROUTES ====================
router.get('/', settingsController.getSettings);

// Profile
router.put('/profile', settingsController.updateProfile);

// Preferences
router.put('/preferences', settingsController.updatePreferences);

// Campuses
router.post('/campuses', settingsController.addCampus);
router.get('/campuses/:campusId', settingsController.getCampusById);
router.put('/campuses/:campusId', settingsController.updateCampus);
router.delete('/campuses/:campusId', settingsController.deleteCampus);
router.patch('/campuses/:campusId/toggle', settingsController.toggleCampusStatus);

// Branding
router.put('/branding', settingsController.updateBranding);

// Integrations
router.put('/integrations/:type', settingsController.updateIntegration);

// Security
router.put('/security', settingsController.updateSecurity);

// Maintenance
router.put('/maintenance', settingsController.updateMaintenance);

// Reset
router.post('/reset', settingsController.resetSettings);

export default router;