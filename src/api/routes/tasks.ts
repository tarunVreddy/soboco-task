import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const taskController = new TaskController();

// Task routes (all require authentication)
router.post('/parse-gmail', authMiddleware, (req, res) => taskController.parseGmailForTasks(req, res));
router.post('/reset-tracking', authMiddleware, (req, res) => taskController.resetMessageTracking(req, res));
router.get('/unparsed-count', authMiddleware, (req, res) => taskController.getUnparsedMessageCount(req, res));
router.get('/', authMiddleware, (req, res) => taskController.getUserTasks(req, res));
router.patch('/:taskId/status', authMiddleware, (req, res) => taskController.updateTaskStatus(req, res));
router.delete('/:taskId', authMiddleware, (req, res) => taskController.deleteTask(req, res));

export default router;
