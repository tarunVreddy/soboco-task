import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '../../db';
import { config } from '../../config';
import { User, Session } from '../database/DatabaseService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResult> {
    const existingUser = await databaseService.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await databaseService.createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    const token = await this.createSession(user.id);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const user = await databaseService.findUserByEmail(credentials.email);

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = await this.createSession(user.id);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async logout(token: string): Promise<void> {
    await databaseService.deleteSession(token);
  }

  async validateToken(token: string): Promise<User | null> {
    const session = await databaseService.findSessionByToken(token);

    if (!session || new Date(session.expires_at) < new Date()) {
      return null;
    }

    return await databaseService.findUserById(session.user_id);
  }

  async createSession(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await databaseService.createSession({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return token;
  }

  async findOrCreateUserBySocialId(
    provider: 'google' | 'microsoft',
    socialId: string,
    email: string,
    name?: string
  ): Promise<AuthResult> {
    const field = provider === 'google' ? 'google_id' : 'microsoft_id';
    
    let user = await databaseService.findUserBySocialId(provider, socialId);
    
    if (!user) {
      // Try to find by email
      user = await databaseService.findUserByEmail(email);
    }

    if (!user) {
      user = await databaseService.createUser({
        email,
        name,
        [field]: socialId,
      });
    } else if (!user[field]) {
      // User exists but doesn't have this social ID
      user = await databaseService.updateUser(user.id, { [field]: socialId });
    }

    const token = await this.createSession(user.id);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    // Get current user to verify current password
    const user = await databaseService.findUserById(userId);
    if (!user || !user.password) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValidCurrentPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    // Update password
    await databaseService.updateUser(userId, { password: hashedNewPassword });
  }
}
