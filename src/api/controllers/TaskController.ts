import { Request, Response } from 'express';
import { TaskService } from '../../services/tasks/TaskService';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  async parseGmailForTasks(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { integrationId } = req.body;

      if (!integrationId) {
        res.status(400).json({ error: 'Integration ID is required' });
        return;
      }

      console.log(`🔍 [DEBUG] Parsing tasks for user ${user.id}, integration ${integrationId}`);
      
      const result = await this.taskService.parseGmailForTasks(user.id, integrationId);
      
      console.log(`✅ [DEBUG] Parse result for integration ${integrationId}:`, result);
      
      res.status(200).json({
        message: 'Gmail parsing completed',
        extracted: result.extracted,
        created: result.created,
        processed: result.processed,
      });
    } catch (error) {
      console.error('Parse Gmail for tasks error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to parse Gmail for tasks' 
      });
    }
  }

  async getUserTasks(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tasks = await this.taskService.getUserTasks(user.id);

      res.status(200).json({ tasks });
    } catch (error) {
      console.error('Get user tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { taskId } = req.params;
      const { status } = req.body;

      if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
        res.status(400).json({ error: 'Valid status is required' });
        return;
      }

      const updatedTask = await this.taskService.updateTaskStatus(taskId, status);

      res.status(200).json({ 
        message: 'Task status updated',
        task: updatedTask 
      });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { taskId } = req.params;

      await this.taskService.deleteTask(taskId);

      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  async resetMessageTracking(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { integrationId } = req.body;

      if (!integrationId) {
        res.status(400).json({ error: 'Integration ID is required' });
        return;
      }

      await this.taskService.resetMessageTracking(user.id, integrationId);

      res.status(200).json({ 
        message: 'Message tracking reset successfully. Next parse will process all messages.' 
      });
    } catch (error) {
      console.error('Reset message tracking error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to reset message tracking' 
      });
    }
  }

  async getUnparsedMessageCount(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { integrationId } = req.query;

      if (!integrationId || typeof integrationId !== 'string') {
        res.status(400).json({ error: 'Integration ID is required' });
        return;
      }

      const count = await this.taskService.getUnparsedMessageCount(user.id, integrationId);

      res.status(200).json({ 
        unparsedCount: count
      });
    } catch (error) {
      console.error('Get unparsed message count error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get unparsed message count' 
      });
    }
  }
}
