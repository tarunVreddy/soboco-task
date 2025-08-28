import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const authController = new AuthController();

// Protected routes only (authentication handled by Supabase OAuth)
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
