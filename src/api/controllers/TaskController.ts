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
      
      // Set up SSE headers for real-time updates
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial status
      res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting parsing...' })}\n\n`);
      
      const result = await this.taskService.parseGmailForTasks(user.id, integrationId, (progress) => {
        // Send progress updates to frontend
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      });
      
      console.log(`✅ [DEBUG] Parse result for integration ${integrationId}:`, result);
      
      // Send final result
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        message: 'Gmail parsing completed',
        extracted: result.extracted,
        created: result.created,
        processed: result.processed,
      })}\n\n`);
      
      res.end();
    } catch (error) {
      console.error('Parse Gmail for tasks error:', error);
      
      // Send error via SSE
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Failed to parse Gmail for tasks' 
      })}\n\n`);
      res.end();
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

  async debugParsing(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      console.log(`🔍 [DEBUG] Debug parsing request for user ${user.id}`);
      
      // Check if user has any integrations
      const integrations = await this.taskService.getIntegrationsForUser(user.id);
      console.log(`🔍 [DEBUG] User has ${integrations.length} integrations:`, integrations.map(i => ({ id: i.id, provider: i.provider, account_email: i.account_email, is_active: i.is_active })));
      
      // Check if Ollama is available
      const isOllamaAvailable = await this.taskService.isOllamaAvailable();
      console.log(`🔍 [DEBUG] Ollama available: ${isOllamaAvailable}`);
      
      // Check if user has any tasks
      const tasks = await this.taskService.getUserTasks(user.id);
      console.log(`🔍 [DEBUG] User has ${tasks.length} tasks`);
      
      res.status(200).json({
        user_id: user.id,
        integrations_count: integrations.length,
        integrations: integrations.map(i => ({ id: i.id, provider: i.provider, account_email: i.account_email, is_active: i.is_active })),
        ollama_available: isOllamaAvailable,
        tasks_count: tasks.length,
        message: 'Debug information logged to console'
      });
    } catch (error) {
      console.error('Debug parsing error:', error);
      res.status(500).json({ error: 'Failed to get debug information' });
    }
  }
}
