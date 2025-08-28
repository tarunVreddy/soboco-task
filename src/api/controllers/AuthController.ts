import { Request, Response } from 'express';
import { AuthService } from '../../services/auth/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Removed password-based authentication methods since we only use Google OAuth

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await this.authService.logout(token);
      }

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      // The user is already attached by the auth middleware
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  // Removed changePassword method since we only use Google OAuth
}
