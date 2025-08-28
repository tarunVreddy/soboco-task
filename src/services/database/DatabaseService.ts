import { supabase } from '../../utils/supabase';

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
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to find user: ${error.message}`);
    return data;
  }

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to find user: ${error.message}`);
    return data;
  }

  async findUserBySocialId(provider: 'google' | 'microsoft', socialId: string): Promise<User | null> {
    const field = provider === 'google' ? 'google_id' : 'microsoft_id';
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq(field, socialId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to find user: ${error.message}`);
    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return data;
  }

  // Session operations
  async createSession(sessionData: Omit<Session, 'id' | 'created_at'>): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        ...sessionData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return data;
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to find session: ${error.message}`);
    return data;
  }

  async deleteSession(token: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token', token);

    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  }

  async deleteExpiredSessions(): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw new Error(`Failed to delete expired sessions: ${error.message}`);
  }

  // Task operations
  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data;
  }

  async findTasksByUserId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to find tasks: ${error.message}`);
    return data || [];
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update task: ${error.message}`);
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete task: ${error.message}`);
  }

  async deleteAllTasksByUserId(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete all tasks for user: ${error.message}`);
  }

  // Integration operations
  async createIntegration(integrationData: Omit<Integration, 'id' | 'created_at' | 'updated_at'>): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        ...integrationData,
        metadata: integrationData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create integration: ${error.message}`);
    return data;
  }

  async findIntegrationsByUserId(userId: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to find integrations: ${error.message}`);
    return data || [];
  }

  async findIntegrationsByProvider(userId: string, provider: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to find integrations: ${error.message}`);
    return data || [];
  }

  async findActiveIntegrationsByProvider(userId: string, provider: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to find active integrations: ${error.message}`);
    return data || [];
  }

  async findIntegrationById(id: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw new Error(`Failed to find integration: ${error.message}`);
    }
    return data;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update integration: ${error.message}`);
    return data;
  }

  async deleteIntegration(id: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete integration: ${error.message}`);
  }

  // Message operations
  async createMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...messageData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return data;
  }

  async findMessagesByUserId(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(`Failed to find messages: ${error.message}`);
    return data || [];
  }

  // Database initialization
  async initializeDatabase(): Promise<void> {
    // This would typically create tables, but Supabase handles this
    // We can add any initialization logic here if needed
    console.log('✅ Database initialized (tables should be created via Supabase dashboard)');
  }

  // ParsedMessage operations
  async createParsedMessage(parsedMessageData: Omit<ParsedMessage, 'id' | 'parsed_at'>): Promise<ParsedMessage> {
    const { data, error } = await supabase
      .from('parsed_messages')
      .insert({
        ...parsedMessageData,
        parsed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create parsed message: ${error.message}`);
    return data;
  }

  async findParsedMessagesByIntegration(userId: string, integrationId: string): Promise<ParsedMessage[]> {
    const { data, error } = await supabase
      .from('parsed_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (error) throw new Error(`Failed to find parsed messages: ${error.message}`);
    return data || [];
  }

  async isMessageParsed(userId: string, integrationId: string, gmailMessageId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('parsed_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .eq('gmail_message_id', gmailMessageId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to check parsed message: ${error.message}`);
    return !!data;
  }

  async clearParsedMessages(userId: string, integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('parsed_messages')
      .delete()
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (error) throw new Error(`Failed to clear parsed messages: ${error.message}`);
  }
}
