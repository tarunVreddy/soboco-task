import { Router } from 'express';
import { GmailController } from '../controllers/GmailController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const gmailController = new GmailController();

// All routes require authentication
router.use(authMiddleware);

// Get Gmail profile
router.get('/profile', (req, res) => gmailController.getGmailProfile(req, res));

// Get Gmail messages
router.get('/messages', (req, res) => gmailController.getGmailMessages(req, res));

// Search Gmail messages
router.get('/search', (req, res) => gmailController.searchGmailMessages(req, res));

// Get unread messages
router.get('/unread', (req, res) => gmailController.getUnreadMessages(req, res));

// Get recent messages
router.get('/recent', (req, res) => gmailController.getRecentMessages(req, res));

export default router;
