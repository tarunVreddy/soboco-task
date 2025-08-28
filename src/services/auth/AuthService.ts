import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '../../db';
import { config } from '../../config';
import { User, Session } from '../database/DatabaseService';

export interface GoogleUserData {
  email: string;
  name?: string;
  google_id: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

// Removed password-related interfaces since we only use Google OAuth

export class AuthService {
  // Removed password-based authentication methods since we only use Google OAuth

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

    return { user, token };
  }

  // Removed changePassword method since we only use Google OAuth
}
