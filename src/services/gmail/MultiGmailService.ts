import { DatabaseService } from '../database/DatabaseService';
import { GmailService, TokenRefreshResult } from './GmailService';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
  // Additional fields for multi-account support
  accountEmail?: string;
  accountName?: string;
  integrationId?: string;
}

export class MultiGmailService {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Create a token refresh callback for a specific integration
   */
  private createTokenRefreshCallback(integrationId: string) {
    return async (result: TokenRefreshResult) => {
      try {
        console.log(`🔄 Updating integration ${integrationId} with new tokens`);
        
        const updateData: any = {
          access_token: result.accessToken,
        };
        
        // Only update refresh token if a new one is provided
        if (result.refreshToken) {
          updateData.refresh_token = result.refreshToken;
        }
        
        await this.databaseService.updateIntegration(integrationId, updateData);
        console.log(`✅ Integration ${integrationId} updated with new tokens`);
      } catch (error) {
        console.error(`❌ Failed to update integration ${integrationId} with new tokens:`, error);
      }
    };
  }

  /**
   * Get messages from all connected Gmail accounts for a user
   */
  async getMessages(userId: string, maxResults: number = 10, query?: string): Promise<GmailMessage[]> {
    try {
      // Get all active Gmail integrations for the user
      const integrations = await this.databaseService.findActiveIntegrationsByProvider(userId, 'google');
      
      if (integrations.length === 0) {
        return [];
      }

      // Get messages from all integrations
      const messagePromises = integrations.map(async (integration) => {
        try {
          const tokenRefreshCallback = this.createTokenRefreshCallback(integration.id);
          const gmailService = new GmailService(
            integration.access_token,
            integration.refresh_token,
            tokenRefreshCallback
          );

          const messages = await gmailService.getMessages(maxResults, query);
          
          // Add account information to each message
          return messages.map(message => ({
            ...message,
            accountEmail: integration.account_email,
            accountName: integration.account_name,
            integrationId: integration.id,
          }));
        } catch (error) {
          console.error(`Error fetching messages from integration ${integration.id}:`, error);
          return [];
        }
      });

      const allMessages = await Promise.all(messagePromises);
      
      // Flatten and sort by date (newest first)
      const flattenedMessages = allMessages.flat().sort((a, b) => {
        const dateA = new Date(parseInt(a.internalDate));
        const dateB = new Date(parseInt(b.internalDate));
        return dateB.getTime() - dateA.getTime();
      });

      // Return only the requested number of messages
      return flattenedMessages.slice(0, maxResults);
    } catch (error) {
      console.error('Error getting messages from multiple Gmail accounts:', error);
      throw error;
    }
  }

  /**
   * Get a specific message from any connected account
   */
  async getMessage(userId: string, messageId: string, integrationId?: string): Promise<GmailMessage> {
    try {
      let integrations;
      
      if (integrationId) {
        // Get specific integration
        const integration = await this.databaseService.findIntegrationById(integrationId);
        if (!integration || integration.user_id !== userId || integration.provider !== 'google') {
          throw new Error('Integration not found or not authorized');
        }
        integrations = [integration];
      } else {
        // Get all integrations and try to find the message
        integrations = await this.databaseService.findActiveIntegrationsByProvider(userId, 'google');
      }

      if (integrations.length === 0) {
        throw new Error('No Gmail integrations found');
      }

      // Try to get the message from each integration until found
      for (const integration of integrations) {
        try {
          const tokenRefreshCallback = this.createTokenRefreshCallback(integration.id);
          const gmailService = new GmailService(
            integration.access_token,
            integration.refresh_token,
            tokenRefreshCallback
          );

          const message = await gmailService.getMessage(messageId);
          
          // Add account information
          return {
            ...message,
            accountEmail: integration.account_email,
            accountName: integration.account_name,
            integrationId: integration.id,
          };
        } catch (error) {
          // Message not found in this integration, try the next one
          console.log(`Message ${messageId} not found in integration ${integration.id}`);
          continue;
        }
      }

      throw new Error(`Message ${messageId} not found in any connected Gmail account`);
    } catch (error) {
      console.error('Error getting message from multiple Gmail accounts:', error);
      throw error;
    }
  }

  /**
   * Get inbox message count from all connected accounts
   */
  async getInboxMessageCount(userId: string): Promise<number> {
    try {
      const integrations = await this.databaseService.findActiveIntegrationsByProvider(userId, 'google');
      
      if (integrations.length === 0) {
        return 0;
      }

      const countPromises = integrations.map(async (integration) => {
        try {
          const tokenRefreshCallback = this.createTokenRefreshCallback(integration.id);
          const gmailService = new GmailService(
            integration.access_token,
            integration.refresh_token,
            tokenRefreshCallback
          );

          return await gmailService.getInboxMessageCount();
        } catch (error) {
          console.error(`Error getting message count from integration ${integration.id}:`, error);
          return 0;
        }
      });

      const counts = await Promise.all(countPromises);
      return counts.reduce((total, count) => total + count, 0);
    } catch (error) {
      console.error('Error getting inbox message count from multiple accounts:', error);
      throw error;
    }
  }

  /**
   * Get profile information from all connected accounts
   */
  async getProfiles(userId: string): Promise<Array<{
    integrationId: string;
    accountEmail: string;
    accountName: string;
    messagesTotal: number;
    isActive: boolean;
  }>> {
    try {
      const integrations = await this.databaseService.findActiveIntegrationsByProvider(userId, 'google');
      
      if (integrations.length === 0) {
        return [];
      }

      const profilePromises = integrations.map(async (integration) => {
        try {
          const tokenRefreshCallback = this.createTokenRefreshCallback(integration.id);
          const gmailService = new GmailService(
            integration.access_token,
            integration.refresh_token,
            tokenRefreshCallback
          );

          const profile = await gmailService.getProfile();
          
          return {
            integrationId: integration.id,
            accountEmail: integration.account_email,
            accountName: integration.account_name,
            messagesTotal: profile.messagesTotal,
            isActive: integration.is_active,
          };
        } catch (error) {
          console.error(`Error getting profile from integration ${integration.id}:`, error);
          return {
            integrationId: integration.id,
            accountEmail: integration.account_email,
            accountName: integration.account_name,
            messagesTotal: 0,
            isActive: false,
          };
        }
      });

      return await Promise.all(profilePromises);
    } catch (error) {
      console.error('Error getting profiles from multiple accounts:', error);
      throw error;
    }
  }
}
