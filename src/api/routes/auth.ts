import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// Protected routes
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));
router.post('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));

export default router;
