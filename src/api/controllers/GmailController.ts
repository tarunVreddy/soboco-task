import { Request, Response } from 'express';
import { GmailService } from '../../services/gmail/GmailService';
import { DatabaseService } from '../../services/database/DatabaseService';
import { TaskService } from '../../services/tasks/TaskService';

export class GmailController {
  private databaseService: DatabaseService;
  private taskService: TaskService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.taskService = new TaskService();
  }

  async getGmailProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { integrationId } = req.query;
      
      let gmailIntegration;
      
      if (integrationId) {
        // Get specific integration
        gmailIntegration = await this.databaseService.findIntegrationById(integrationId as string);
        if (!gmailIntegration || gmailIntegration.user_id !== user.id || gmailIntegration.provider !== 'google') {
          res.status(404).json({ error: 'Gmail integration not found' });
          return;
        }
      } else {
        // Get first active Gmail integration
        const integrations = await this.databaseService.findActiveIntegrationsByProvider(user.id, 'google');
        gmailIntegration = integrations[0];
      }

      if (!gmailIntegration || !gmailIntegration.access_token) {
        res.status(400).json({ error: 'Gmail integration not found or no access token' });
        return;
      }

      const gmailService = new GmailService(gmailIntegration.access_token);
      const profile = await gmailService.getProfile();
      
      // Get unparsed message count instead of total inbox count
      const unparsedCount = await this.taskService.getUnparsedMessageCount(user.id, gmailIntegration.id);

      res.status(200).json({ 
        profile: {
          ...profile,
          messagesTotal: unparsedCount // Show unparsed message count
        },
        integration: {
          id: gmailIntegration.id,
          account_name: gmailIntegration.account_name,
          account_email: gmailIntegration.account_email
        }
      });
    } catch (error) {
      console.error('Get Gmail profile error:', error);
      res.status(500).json({ error: 'Failed to fetch Gmail profile' });
    }
  }

  async getGmailMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { maxResults = 10, query } = req.query;

      // Get user's Gmail integration
      const integrations = await this.databaseService.findIntegrationsByUserId(user.id);
      const gmailIntegration = integrations.find(integration => 
        integration.provider === 'gmail'
      );

      if (!gmailIntegration || !gmailIntegration.access_token) {
        res.status(400).json({ error: 'Gmail integration not found or no access token' });
        return;
      }

      const gmailService = new GmailService(gmailIntegration.access_token);
      const messages = await gmailService.getMessages(
        parseInt(maxResults as string),
        query as string
      );

      // Process messages to extract relevant information
      const processedMessages = messages.map(message => ({
        id: message.id,
        threadId: message.threadId,
        subject: gmailService.getSubject(message),
        sender: gmailService.getSenderEmail(message),
        snippet: message.snippet,
        date: gmailService.getDate(message),
        content: gmailService.extractEmailContent(message),
        labels: message.labelIds
      }));

      res.status(200).json({ messages: processedMessages });
    } catch (error) {
      console.error('Get Gmail messages error:', error);
      res.status(500).json({ error: 'Failed to fetch Gmail messages' });
    }
  }

  async searchGmailMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { query, maxResults = 10 } = req.query;

      if (!query) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      // Get user's Gmail integration
      const integrations = await this.databaseService.findIntegrationsByUserId(user.id);
      const gmailIntegration = integrations.find(integration => 
        integration.provider === 'gmail'
      );

      if (!gmailIntegration || !gmailIntegration.access_token) {
        res.status(400).json({ error: 'Gmail integration not found or no access token' });
        return;
      }

      const gmailService = new GmailService(gmailIntegration.access_token);
      const messages = await gmailService.searchMessages(
        query as string,
        parseInt(maxResults as string)
      );

      // Process messages to extract relevant information
      const processedMessages = messages.map(message => ({
        id: message.id,
        threadId: message.threadId,
        subject: gmailService.getSubject(message),
        sender: gmailService.getSenderEmail(message),
        snippet: message.snippet,
        date: gmailService.getDate(message),
        content: gmailService.extractEmailContent(message),
        labels: message.labelIds
      }));

      res.status(200).json({ messages: processedMessages });
    } catch (error) {
      console.error('Search Gmail messages error:', error);
      res.status(500).json({ error: 'Failed to search Gmail messages' });
    }
  }

  async getUnreadMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { maxResults = 10 } = req.query;

      // Get user's Gmail integration
      const integrations = await this.databaseService.findIntegrationsByUserId(user.id);
      const gmailIntegration = integrations.find(integration => 
        integration.provider === 'gmail'
      );

      if (!gmailIntegration || !gmailIntegration.access_token) {
        res.status(400).json({ error: 'Gmail integration not found or no access token' });
        return;
      }

      const gmailService = new GmailService(gmailIntegration.access_token);
      const messages = await gmailService.getUnreadMessages(
        parseInt(maxResults as string)
      );

      // Process messages to extract relevant information
      const processedMessages = messages.map(message => ({
        id: message.id,
        threadId: message.threadId,
        subject: gmailService.getSubject(message),
        sender: gmailService.getSenderEmail(message),
        snippet: message.snippet,
        date: gmailService.getDate(message),
        content: gmailService.extractEmailContent(message),
        labels: message.labelIds
      }));

      res.status(200).json({ messages: processedMessages });
    } catch (error) {
      console.error('Get unread Gmail messages error:', error);
      res.status(500).json({ error: 'Failed to fetch unread Gmail messages' });
    }
  }

  async getRecentMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { maxResults = 10 } = req.query;

      // Get user's Gmail integration
      const integrations = await this.databaseService.findIntegrationsByUserId(user.id);
      const gmailIntegration = integrations.find(integration => 
        integration.provider === 'gmail'
      );

      if (!gmailIntegration || !gmailIntegration.access_token) {
        res.status(400).json({ error: 'Gmail integration not found or no access token' });
        return;
      }

      const gmailService = new GmailService(gmailIntegration.access_token);
      const messages = await gmailService.getRecentMessages(
        parseInt(maxResults as string)
      );

      // Process messages to extract relevant information
      const processedMessages = messages.map(message => ({
        id: message.id,
        threadId: message.threadId,
        subject: gmailService.getSubject(message),
        sender: gmailService.getSenderEmail(message),
        snippet: message.snippet,
        date: gmailService.getDate(message),
        content: gmailService.extractEmailContent(message),
        labels: message.labelIds
      }));

      res.status(200).json({ messages: processedMessages });
    } catch (error) {
      console.error('Get recent Gmail messages error:', error);
      res.status(500).json({ error: 'Failed to fetch recent Gmail messages' });
    }
  }
}
