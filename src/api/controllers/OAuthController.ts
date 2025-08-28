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

      // Parse state parameter to determine action
      let action = 'login';
      let currentUserId: string | undefined;
      
      if (state) {
        try {
          const stateData = JSON.parse(state as string);
          action = stateData.action || 'login';
          currentUserId = stateData.currentUserId;
        } catch (error) {
          console.log('Invalid state parameter, using default action: login');
        }
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

      let authResult: { user: any; token: string };

      // Handle different actions
      if (action === 'add-account' && currentUserId) {
        // For adding additional account, use the current user ID
        const currentUser = await this.databaseService.findUserById(currentUserId);
        if (!currentUser) {
          throw new Error('Current user not found');
        }
        
        // Use the current user's account
        const token = await this.authService.createSession(currentUser.id);
        authResult = { user: currentUser, token };
        console.log('Adding additional account to existing user:', currentUser.id);
      } else {
        // For login or when no current user ID, use the existing logic
        authResult = await this.authService.findOrCreateUserBySocialId(
          'google',
          google_id,
          email,
          name
        );
      }

      // Check if Gmail integration already exists for this user and email
      const existingIntegrations = await this.databaseService.findIntegrationsByProvider(
        authResult.user.id,
        'google'
      );

      const existingIntegration = existingIntegrations.find(
        integration => integration.account_email === email
      );

      if (existingIntegration) {
        console.log('Gmail integration already exists for user:', authResult.user.id);
        // Update the existing integration with new tokens
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
      } else {
        console.log('Creating new Gmail integration for user:', authResult.user.id);
        // Create a new Gmail integration
        await this.databaseService.createIntegration({
          user_id: authResult.user.id,
          provider: 'google',
          account_name: name || `Gmail (${email})`,
          account_email: email,
          access_token,
          refresh_token,
          is_active: true,
          metadata: {
            picture,
            google_id,
          },
        });
        console.log('New Gmail integration created successfully');
      }

      // Redirect to frontend OAuth callback with token and action
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth-callback?token=${authResult.token}&action=${action}`;
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
      const { action = 'login', currentUserId } = req.query;
      
      // Create state parameter to track the action
      const state = JSON.stringify({ action, currentUserId });
      
      // Use Gmail scopes for inbox access
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
      console.error('Error generating Google auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  }
}
