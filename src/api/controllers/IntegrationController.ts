import { Request, Response } from 'express';
import { DatabaseService } from '../../services/database/DatabaseService';

export class IntegrationController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async getIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const integrations = await this.databaseService.findIntegrationsByUserId(user.id);
      res.status(200).json({ integrations });
    } catch (error) {
      console.error('Get integrations error:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  async addGoogleEmail(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { accountName, accountEmail, accessToken, refreshToken } = req.body;

      if (!accountName || !accountEmail || !accessToken) {
        res.status(400).json({ error: 'Account name, email, and access token are required' });
        return;
      }

      // Check if this specific email is already connected for this user
      const existingIntegrations = await this.databaseService.findIntegrationsByProvider(user.id, 'google');
      const existingGoogle = existingIntegrations.find(integration => 
        integration.account_email === accountEmail
      );

      if (existingGoogle) {
        res.status(400).json({ error: 'This Gmail account is already connected' });
        return;
      }

      const integration = await this.databaseService.createIntegration({
        user_id: user.id,
        provider: 'google',
        account_name: accountName,
        account_email: accountEmail,
        access_token: accessToken,
        refresh_token: refreshToken,
        is_active: true,
        metadata: {
          connected_at: new Date().toISOString(),
          provider_version: 'gmail-api-v1'
        }
      });

      res.status(201).json({ 
        message: 'Gmail account connected successfully',
        integration 
      });
    } catch (error) {
      console.error('Add Google Email error:', error);
      res.status(500).json({ error: 'Failed to connect Gmail account' });
    }
  }

  async removeIntegration(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const integration = await this.databaseService.findIntegrationById(id);
      
      if (!integration) {
        res.status(404).json({ error: 'Integration not found' });
        return;
      }

      if (integration.user_id !== user.id) {
        res.status(403).json({ error: 'Not authorized to remove this integration' });
        return;
      }

      await this.databaseService.deleteIntegration(id);
      res.status(200).json({ message: 'Integration removed successfully' });
    } catch (error) {
      console.error('Remove integration error:', error);
      res.status(500).json({ error: 'Failed to remove integration' });
    }
  }

  async toggleIntegration(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { isActive } = req.body;

      const integration = await this.databaseService.findIntegrationById(id);
      
      if (!integration) {
        res.status(404).json({ error: 'Integration not found' });
        return;
      }

      if (integration.user_id !== user.id) {
        res.status(403).json({ error: 'Not authorized to modify this integration' });
        return;
      }

      const updatedIntegration = await this.databaseService.updateIntegration(id, {
        is_active: isActive
      });

      res.status(200).json({ 
        message: `Integration ${isActive ? 'activated' : 'deactivated'} successfully`,
        integration: updatedIntegration 
      });
    } catch (error) {
      console.error('Toggle integration error:', error);
      res.status(500).json({ error: 'Failed to update integration' });
    }
  }
}
