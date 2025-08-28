import { Request, Response } from 'express';
import { DatabaseService } from '../../services/database/DatabaseService';
import { GmailService } from '../../services/gmail/GmailService';

export class IntegrationController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Get all integrations for the current user (keychain)
   */
  async getIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      // Get all integrations for the user
      const integrations = await this.databaseService.findIntegrationsByUserId(user.id);
      
      // Get detailed information for each integration
      const detailedIntegrations = await Promise.all(integrations.map(async (integration) => {
        try {
                     if (integration.provider === 'google') {
             // Get Gmail profile information
             const gmailService = new GmailService(integration.access_token);

             const profile = await gmailService.getProfile();
             const messageCount = await gmailService.getInboxMessageCount();
            
            return {
              id: integration.id,
              provider: integration.provider,
              account_name: integration.account_name,
              account_email: integration.account_email,
              is_active: integration.is_active,
              created_at: integration.created_at,
              updated_at: integration.updated_at,
              metadata: {
                ...integration.metadata,
                messagesTotal: profile.messagesTotal,
                inboxCount: messageCount,
                isConnected: true
              }
            };
          } else {
            // For other providers, return basic info
            return {
              id: integration.id,
              provider: integration.provider,
              account_name: integration.account_name,
              account_email: integration.account_email,
              is_active: integration.is_active,
              created_at: integration.created_at,
              updated_at: integration.updated_at,
              metadata: {
                ...integration.metadata,
                isConnected: false
              }
            };
          }
        } catch (error) {
          console.error(`Error getting details for integration ${integration.id}:`, error);
          return {
            id: integration.id,
            provider: integration.provider,
            account_name: integration.account_name,
            account_email: integration.account_email,
            is_active: integration.is_active,
            created_at: integration.created_at,
            updated_at: integration.updated_at,
            metadata: {
              ...integration.metadata,
              isConnected: false,
              error: 'Failed to connect'
            }
          };
        }
      }));

      res.status(200).json({ 
        integrations: detailedIntegrations,
        totalAccounts: detailedIntegrations.length,
        activeAccounts: detailedIntegrations.filter(i => i.is_active).length
      });
    } catch (error) {
      console.error('Get integrations error:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  /**
   * Remove an integration from the keychain
   */
  async removeIntegration(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { integrationId } = req.params;

      const integration = await this.databaseService.findIntegrationById(integrationId);
      
      if (!integration) {
        res.status(404).json({ error: 'Integration not found' });
        return;
      }

      if (integration.user_id !== user.id) {
        res.status(403).json({ error: 'Not authorized to remove this integration' });
        return;
      }

      await this.databaseService.deleteIntegration(integrationId);
      res.status(200).json({ message: 'Integration removed successfully' });
    } catch (error) {
      console.error('Remove integration error:', error);
      res.status(500).json({ error: 'Failed to remove integration' });
    }
  }

  /**
   * Toggle integration active status
   */
  async toggleIntegration(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { integrationId } = req.params;
      const { is_active } = req.body;

      const integration = await this.databaseService.findIntegrationById(integrationId);
      
      if (!integration) {
        res.status(404).json({ error: 'Integration not found' });
        return;
      }

      if (integration.user_id !== user.id) {
        res.status(403).json({ error: 'Not authorized to modify this integration' });
        return;
      }

      await this.databaseService.updateIntegration(integrationId, { is_active });
      res.status(200).json({ message: 'Integration updated successfully' });
    } catch (error) {
      console.error('Toggle integration error:', error);
      res.status(500).json({ error: 'Failed to update integration' });
    }
  }

  /**
   * Get OAuth URL for adding a new account
   */
  async getAddAccountUrl(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { provider = 'google' } = req.query;

      if (provider !== 'google') {
        res.status(400).json({ error: 'Only Google provider is supported' });
        return;
      }

      // Create state parameter for adding account
      const state = JSON.stringify({ 
        action: 'add-account', 
        currentUserId: user.id 
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(state)}`;

      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating add account URL:', error);
      res.status(500).json({ error: 'Failed to generate add account URL' });
    }
  }
}
