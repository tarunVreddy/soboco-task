import { Request, Response } from 'express';
import { AuthService, LoginCredentials, RegisterData, ChangePasswordData } from '../../services/auth/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body as RegisterData;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.register({ email, password, name });
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginCredentials;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.login({ email, password });
      
      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid credentials' });
    }
  }

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

      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body as ChangePasswordData;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters long' });
        return;
      }

      await this.authService.changePassword(user.id, { currentPassword, newPassword });
      
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to change password' });
    }
  }
}
