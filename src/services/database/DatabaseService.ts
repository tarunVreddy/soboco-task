import { query, getClient } from '../../utils/postgres';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name?: string;
  google_id?: string;
  microsoft_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
  source: string;
  source_id?: string;
  message_id?: string;
  user_id: string;
  integration_id?: string;
  account_email?: string;
  account_name?: string;
  email_received_at?: string;
  email_sender?: string;
  email_recipients?: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedMessage {
  id: string;
  user_id: string;
  integration_id: string;
  gmail_message_id: string;
  parsed_at: string;
  tasks_extracted: number;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: string;
  account_name: string;
  account_email: string;
  access_token: string;
  refresh_token?: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  source: string;
  source_id: string;
  content: string;
  sender?: string;
  timestamp: string;
  metadata?: any;
  user_id: string;
  created_at: string;
}

export class DatabaseService {
  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const result = await query(
      `INSERT INTO users (id, email, name, google_id, microsoft_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, userData.email, userData.name, userData.google_id, userData.microsoft_id, now, now]
    );

    if (result.rows.length === 0) throw new Error('Failed to create user');
    return result.rows[0];
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findUserBySocialId(provider: 'google' | 'microsoft', socialId: string): Promise<User | null> {
    const field = provider === 'google' ? 'google_id' : 'microsoft_id';
    const result = await query(
      `SELECT * FROM users WHERE ${field} = $1`,
      [socialId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    fields.push(`updated_at = $${paramIndex}`);
    values.push(now);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('Failed to update user');
    return result.rows[0];
  }

  // Session operations
  async createSession(sessionData: Omit<Session, 'id' | 'created_at'>): Promise<Session> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const result = await query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, sessionData.user_id, sessionData.token, sessionData.expires_at, now]
    );

    if (result.rows.length === 0) throw new Error('Failed to create session');
    return result.rows[0];
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const result = await query(
      'SELECT * FROM sessions WHERE token = $1',
      [token]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteSession(token: string): Promise<void> {
    await query(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );
  }

  async deleteExpiredSessions(): Promise<void> {
    await query(
      'DELETE FROM sessions WHERE expires_at < $1',
      [new Date().toISOString()]
    );
  }

  // Task operations
  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const result = await query(
      `INSERT INTO tasks (id, user_id, integration_id, title, description, status, priority, 
       due_date, source, source_id, message_id, account_email, account_name, 
       email_received_at, email_sender, email_recipients, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [id, taskData.user_id, taskData.integration_id, taskData.title, taskData.description,
       taskData.status || 'PENDING', taskData.priority || 'MEDIUM', taskData.due_date, 
       taskData.source, taskData.source_id, taskData.message_id, taskData.account_email, 
       taskData.account_name, taskData.email_received_at, taskData.email_sender, 
       taskData.email_recipients, now, now]
    );

    if (result.rows.length === 0) throw new Error('Failed to create task');
    return result.rows[0];
  }

  async findTasksByUserId(userId: string): Promise<Task[]> {
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows || [];
  }

  async findTaskById(taskId: string): Promise<Task | null> {
    const result = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    fields.push(`updated_at = $${paramIndex}`);
    values.push(now);
    values.push(id);

    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('Failed to update task');
    return result.rows[0];
  }

  async deleteTask(id: string): Promise<void> {
    await query('DELETE FROM tasks WHERE id = $1', [id]);
  }

  async deleteAllTasksByUserId(userId: string): Promise<void> {
    await query('DELETE FROM tasks WHERE user_id = $1', [userId]);
  }

  // Integration operations
  async createIntegration(integrationData: Omit<Integration, 'id' | 'created_at' | 'updated_at'>): Promise<Integration> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const result = await query(
      `INSERT INTO integrations (id, user_id, provider, account_email, account_name, 
       access_token, refresh_token, is_active, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, integrationData.user_id, integrationData.provider, integrationData.account_email,
       integrationData.account_name, integrationData.access_token, integrationData.refresh_token,
       integrationData.is_active !== false, JSON.stringify(integrationData.metadata || {}), now, now]
    );

    if (result.rows.length === 0) throw new Error('Failed to create integration');
    return result.rows[0];
  }

  async findIntegrationsByUserId(userId: string): Promise<Integration[]> {
    const result = await query(
      'SELECT * FROM integrations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows || [];
  }

  async findIntegrationsByProvider(userId: string, provider: string): Promise<Integration[]> {
    const result = await query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2 ORDER BY created_at DESC',
      [userId, provider]
    );

    return result.rows || [];
  }

  async findActiveIntegrationsByProvider(userId: string, provider: string): Promise<Integration[]> {
    const result = await query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2 AND is_active = true ORDER BY created_at DESC',
      [userId, provider]
    );

    return result.rows || [];
  }

  async findIntegrationById(id: string): Promise<Integration | null> {
    const result = await query(
      'SELECT * FROM integrations WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        if (key === 'metadata') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }
    
    fields.push(`updated_at = $${paramIndex}`);
    values.push(now);
    values.push(id);

    const result = await query(
      `UPDATE integrations SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('Failed to update integration');
    return result.rows[0];
  }

  async deleteIntegration(id: string): Promise<void> {
    await query('DELETE FROM integrations WHERE id = $1', [id]);
  }

  // Message operations
  async createMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const result = await query(
      `INSERT INTO messages (id, source, source_id, content, sender, timestamp, metadata, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, messageData.source, messageData.source_id, messageData.content, messageData.sender,
       messageData.timestamp, JSON.stringify(messageData.metadata || {}), messageData.user_id, now]
    );

    if (result.rows.length === 0) throw new Error('Failed to create message');
    return result.rows[0];
  }

  async findMessagesByUserId(userId: string): Promise<Message[]> {
    const result = await query(
      'SELECT * FROM messages WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );

    return result.rows || [];
  }

  // Database initialization
  async initializeDatabase(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const schemaPath = path.join(__dirname, '../../db/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema by semicolons, but handle multi-line statements properly
      const statements = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = '';
      
      const lines = schema.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip comments
        if (trimmedLine.startsWith('--')) {
          continue;
        }
        
        // Handle dollar-quoted strings
        if (trimmedLine.includes('$$')) {
          if (!inDollarQuote) {
            // Starting a dollar quote
            const match = trimmedLine.match(/\$(\w*)\$/);
            if (match) {
              dollarTag = match[1];
              inDollarQuote = true;
            }
          } else {
            // Check if this line ends the dollar quote
            if (trimmedLine.includes(`$$${dollarTag}$$`)) {
              inDollarQuote = false;
              dollarTag = '';
            }
          }
        }
        
        currentStatement += line + '\n';
        
        // If we're not in a dollar quote and line ends with semicolon, we have a complete statement
        if (!inDollarQuote && trimmedLine.endsWith(';')) {
          const statement = currentStatement.trim();
          if (statement.length > 0) {
            statements.push(statement);
          }
          currentStatement = '';
        }
      }
      
      // Execute each statement
      for (const statement of statements) {
        try {
          await query(statement);
        } catch (error: any) {
          // Skip errors for already existing objects
          if (error.code === '42P07' || error.code === '42710' || error.code === '42P16') {
            console.log(`⚠️  Skipping existing object: ${error.message}`);
            continue;
          }
          throw error;
        }
      }
      
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }

  // ParsedMessage operations
  async createParsedMessage(parsedMessageData: Omit<ParsedMessage, 'id' | 'parsed_at'>): Promise<ParsedMessage> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const result = await query(
      `INSERT INTO parsed_messages (id, user_id, integration_id, gmail_message_id, parsed_at, tasks_extracted)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, integration_id, gmail_message_id) 
       DO UPDATE SET tasks_extracted = EXCLUDED.tasks_extracted, parsed_at = EXCLUDED.parsed_at
       RETURNING *`,
      [id, parsedMessageData.user_id, parsedMessageData.integration_id, parsedMessageData.gmail_message_id, now, parsedMessageData.tasks_extracted || 0]
    );

    if (result.rows.length === 0) throw new Error('Failed to create parsed message');
    return result.rows[0];
  }

  async findParsedMessagesByIntegration(userId: string, integrationId: string): Promise<ParsedMessage[]> {
    const result = await query(
      'SELECT * FROM parsed_messages WHERE user_id = $1 AND integration_id = $2',
      [userId, integrationId]
    );

    return result.rows || [];
  }

  async isMessageParsed(userId: string, integrationId: string, gmailMessageId: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM parsed_messages WHERE user_id = $1 AND integration_id = $2 AND gmail_message_id = $3',
      [userId, integrationId, gmailMessageId]
    );

    return result.rows.length > 0;
  }

  async clearParsedMessages(userId: string, integrationId: string): Promise<void> {
    await query(
      'DELETE FROM parsed_messages WHERE user_id = $1 AND integration_id = $2',
      [userId, integrationId]
    );
  }
}
