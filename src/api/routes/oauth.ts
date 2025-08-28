import { Router } from 'express';
import { OAuthController } from '../controllers/OAuthController';

const router = Router();
const oauthController = new OAuthController();

// OAuth routes
router.get('/google/auth-url', (req, res) => oauthController.getGoogleAuthUrl(req, res));
router.get('/google/callback', (req, res) => oauthController.handleGoogleCallback(req, res));

export default router;
