import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { OAuthController } from '../controllers/OAuthController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const authController = new AuthController();
const oauthController = new OAuthController();

// OAuth routes
router.get('/google-auth-url', (req, res) => oauthController.getGoogleAuthUrl(req, res));

// Protected routes only (authentication handled by Google OAuth)
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
