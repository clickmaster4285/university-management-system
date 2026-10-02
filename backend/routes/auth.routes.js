// backend/src/routes/auth.routes.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);

router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);
router.post('/logout', auth, authController.logout);

export default router;