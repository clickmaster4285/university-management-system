// backend/src/routes/settings.routes.js
import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { requireModule } from '../middleware/requireModule.js';
import * as settingsController from '../controllers/settings.controller.js';

const router = express.Router();

router.use(auth, authorize("Admin"), requireModule('settings'));

// ==================== SETTINGS ROUTES ====================
router.get('/', settingsController.getSettings);

// Profile
router.put('/profile', settingsController.updateProfile);

// Preferences
router.put('/preferences', settingsController.updatePreferences);

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