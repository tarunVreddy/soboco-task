import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const integrationController = new IntegrationController();

// All routes require authentication
router.use(authMiddleware);

// Get all integrations (keychain)
router.get('/', (req, res) => integrationController.getIntegrations(req, res));

// Get OAuth URL for adding a new account
router.get('/add-account-url', (req, res) => integrationController.getAddAccountUrl(req, res));

// Remove an integration
router.delete('/:integrationId', (req, res) => integrationController.removeIntegration(req, res));

// Toggle integration active status
router.patch('/:integrationId/toggle', (req, res) => integrationController.toggleIntegration(req, res));

export default router;
