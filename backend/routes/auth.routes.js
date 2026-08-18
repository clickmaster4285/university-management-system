// backend/src/routes/auth.routes.js
import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', authController.changePassword);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

export default router;