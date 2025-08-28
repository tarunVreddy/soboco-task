import { Request, Response } from 'express';
import { AuthService } from '../../services/auth/AuthService';
import { DatabaseService } from '../../services/database/DatabaseService';
import axios from 'axios';

export class OAuthController {
  private authService: AuthService;
  private databaseService: DatabaseService;

  constructor() {
    this.authService = new AuthService();
    this.databaseService = new DatabaseService();
  }

  async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;
      
      console.log('OAuth callback received:', { code: !!code, state, query: req.query });
      
      if (!code) {
        console.log('No authorization code provided');
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      // Exchange code for tokens
      console.log('Exchanging code for tokens...');
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      });
      
      console.log('Token exchange successful');

      const { access_token, refresh_token, id_token } = tokenResponse.data;

      // Get user info from Google
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const { id: google_id, email, name, picture } = userInfoResponse.data;

      // Create or update user in our database
      const authResult = await this.authService.findOrCreateUserBySocialId(
        'google',
        google_id,
        email,
        name
      );

      // Check if Gmail integration already exists for this user
      const existingIntegrations = await this.databaseService.findIntegrationsByProvider(
        authResult.user.id,
        'google'
      );

      const hasGmailIntegration = existingIntegrations.some(
        integration => integration.account_email === email
      );

      // If no Gmail integration exists, create one automatically
      if (!hasGmailIntegration) {
        console.log('Creating Gmail integration for user:', authResult.user.id);
        await this.databaseService.createIntegration({
          user_id: authResult.user.id,
          provider: 'google',
          account_name: name || 'My Gmail',
          account_email: email,
          access_token,
          refresh_token,
          is_active: true,
          metadata: {
            picture,
            google_id,
          },
        });
        console.log('Gmail integration created successfully');
      } else {
        console.log('Gmail integration already exists for user:', authResult.user.id);
        // Update the existing integration with new tokens
        const existingIntegration = existingIntegrations.find(
          integration => integration.account_email === email
        );
        if (existingIntegration) {
          await this.databaseService.updateIntegration(existingIntegration.id, {
            access_token,
            refresh_token,
            metadata: {
              ...existingIntegration.metadata,
              picture,
              google_id,
            },
          });
          console.log('Gmail integration updated with new tokens');
        }
      }

      // Redirect to frontend OAuth callback with token
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth-callback?token=${authResult.token}`;
      console.log('Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
      res.status(500).json({ error: 'OAuth callback failed' });
    }
  }

  async getGoogleAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      // Use Gmail scopes for inbox access
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;

      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  }
}
