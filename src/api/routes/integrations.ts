import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const integrationController = new IntegrationController();

// All routes require authentication
router.use(authMiddleware);

// Get user's integrations
router.get('/', (req, res) => integrationController.getIntegrations(req, res));

// Add Google Email integration
router.post('/gmail', (req, res) => integrationController.addGoogleEmail(req, res));

// Remove integration
router.delete('/:id', (req, res) => integrationController.removeIntegration(req, res));

// Toggle integration (activate/deactivate)
router.patch('/:id/toggle', (req, res) => integrationController.toggleIntegration(req, res));

export default router;
