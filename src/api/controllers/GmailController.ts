import { Request, Response } from 'express';
import { GmailService } from '../../services/gmail/GmailService';
import { MultiGmailService } from '../../services/gmail/MultiGmailService';
import { DatabaseService } from '../../services/database/DatabaseService';
import { TaskService } from '../../services/tasks/TaskService';

export class GmailController {
  private databaseService: DatabaseService;
  private taskService: TaskService;
  private multiGmailService: MultiGmailService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.taskService = new TaskService();
    this.multiGmailService = new MultiGmailService();
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

      // Create token refresh callback for this integration
      const tokenRefreshCallback = async (result: any) => {
        try {
          console.log(`🔄 Updating integration ${gmailIntegration.id} with new tokens`);
          await this.databaseService.updateIntegration(gmailIntegration.id, {
            access_token: result.accessToken,
            refresh_token: result.refreshToken || gmailIntegration.refresh_token,
          });
          console.log(`✅ Integration ${gmailIntegration.id} updated with new tokens`);
        } catch (error) {
          console.error(`❌ Failed to update integration ${gmailIntegration.id} with new tokens:`, error);
        }
      };

      const gmailService = new GmailService(
        gmailIntegration.access_token,
        gmailIntegration.refresh_token,
        tokenRefreshCallback
      );
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

  async getGmailMessageCounts(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      // Get all active Gmail integrations for the user
      const integrations = await this.databaseService.findActiveIntegrationsByProvider(user.id, 'google');
      
      if (integrations.length === 0) {
        res.status(200).json({
          accounts: [],
          totals: {
            totalMessages: 0,
            parsedMessages: 0,
            unparsedMessages: 0,
            activeAccounts: 0
          }
        });
        return;
      }

      const accountCounts = [];
      let totalMessages = 0;
      let totalParsedMessages = 0;
      let totalUnparsedMessages = 0;

      // Get counts for each account
      for (const integration of integrations) {
        try {
          // Create token refresh callback for this integration
          const tokenRefreshCallback = async (result: any) => {
            try {
              console.log(`🔄 Updating integration ${integration.id} with new tokens`);
              await this.databaseService.updateIntegration(integration.id, {
                access_token: result.accessToken,
                refresh_token: result.refreshToken || integration.refresh_token,
              });
              console.log(`✅ Integration ${integration.id} updated with new tokens`);
            } catch (error) {
              console.error(`❌ Failed to update integration ${integration.id} with new tokens:`, error);
            }
          };

          const gmailService = new GmailService(
            integration.access_token,
            integration.refresh_token,
            tokenRefreshCallback
          );
          
          // Get total inbox messages
          const inboxCount = await gmailService.getInboxMessageCount();
          
          // Get parsed messages count
          const parsedMessages = await this.databaseService.findParsedMessagesByIntegration(user.id, integration.id);
          const parsedCount = parsedMessages.length;
          
          // Calculate unparsed messages
          const unparsedCount = Math.max(0, inboxCount - parsedCount);
          
          accountCounts.push({
            integrationId: integration.id,
            accountName: integration.account_name,
            accountEmail: integration.account_email,
            isActive: integration.is_active,
            counts: {
              totalMessages: inboxCount,
              parsedMessages: parsedCount,
              unparsedMessages: unparsedCount
            }
          });
          
          totalMessages += inboxCount;
          totalParsedMessages += parsedCount;
          totalUnparsedMessages += unparsedCount;
          
        } catch (error) {
          console.error(`Error getting counts for integration ${integration.id}:`, error);
          
          // Add account with error state
          accountCounts.push({
            integrationId: integration.id,
            accountName: integration.account_name,
            accountEmail: integration.account_email,
            isActive: integration.is_active,
            error: 'Failed to fetch message counts',
            counts: {
              totalMessages: 0,
              parsedMessages: 0,
              unparsedMessages: 0
            }
          });
        }
      }

      const activeAccounts = integrations.filter(integration => integration.is_active).length;

      res.status(200).json({
        accounts: accountCounts,
        totals: {
          totalMessages,
          parsedMessages: totalParsedMessages,
          unparsedMessages: totalUnparsedMessages,
          activeAccounts
        }
      });
    } catch (error) {
      console.error('Get Gmail message counts error:', error);
      res.status(500).json({ error: 'Failed to fetch Gmail message counts' });
    }
  }

  async getGmailMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { maxResults = 10, query } = req.query;

      // Use MultiGmailService to get messages from all connected accounts
      const messages = await this.multiGmailService.getMessages(
        user.id,
        parseInt(maxResults as string),
        query as string
      );

      // Process messages to extract relevant information
      const processedMessages = messages.map((message: any) => {
        const gmailService = new GmailService(''); // Empty token since we already have the message
        return {
          id: message.id,
          threadId: message.threadId,
          subject: gmailService.getSubject(message),
          sender: gmailService.getSenderEmail(message),
          snippet: message.snippet,
          date: gmailService.getDate(message),
          content: gmailService.extractEmailContent(message),
          labels: message.labelIds,
          accountEmail: message.accountEmail,
          accountName: message.accountName,
          integrationId: message.integrationId
        };
      });

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

  async getEmailContent(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { messageId } = req.params;
      const { integrationId } = req.query;

      if (!messageId) {
        res.status(400).json({ error: 'Message ID is required' });
        return;
      }

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

      // Create token refresh callback for this integration
      const tokenRefreshCallback = async (result: any) => {
        try {
          console.log(`🔄 Updating integration ${gmailIntegration.id} with new tokens`);
          await this.databaseService.updateIntegration(gmailIntegration.id, {
            access_token: result.accessToken,
            refresh_token: result.refreshToken || gmailIntegration.refresh_token,
          });
          console.log(`✅ Integration ${gmailIntegration.id} updated with new tokens`);
        } catch (error) {
          console.error(`❌ Failed to update integration ${gmailIntegration.id} with new tokens:`, error);
        }
      };

      const gmailService = new GmailService(
        gmailIntegration.access_token,
        gmailIntegration.refresh_token,
        tokenRefreshCallback
      );

      const message = await gmailService.getMessage(messageId);
      
      const emailContent = {
        id: message.id,
        threadId: message.threadId,
        subject: gmailService.getSubject(message),
        sender: gmailService.getSenderEmail(message),
        recipients: gmailService.getRecipients(message),
        snippet: message.snippet,
        date: gmailService.getDate(message),
        content: gmailService.extractEmailContent(message),
        headers: gmailService.extractEmailHeaders(message)
      };

      res.status(200).json(emailContent);
    } catch (error) {
      console.error('Get email content error:', error);
      res.status(500).json({ error: 'Failed to fetch email content' });
    }
  }
}
