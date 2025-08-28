# Supabase Setup Guide

This guide will help you set up Supabase for the SoBoCo Task Management App with multi-account Gmail integration and AI-powered task extraction.

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `soboco-task` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Get Database Connection String

1. In your Supabase dashboard, go to **Settings** > **Database**
2. Scroll down to "Connection string"
3. Select "URI" format
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password

### 4. Update Environment Variables

#### Option A: Interactive Setup (Recommended)

Run the interactive setup script:
```bash
npm run setup:db
```

This will guide you through the setup process and automatically generate your `.env` file.

#### Option B: Manual Setup

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Update your `.env` file with the Supabase credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key-here"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   SUPABASE_DB_PASSWORD="your-database-password"
   DATABASE_URL="postgresql://postgres:your-database-password@db.your-project-id.supabase.co:5432/postgres"
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET="your-super-secret-jwt-key-here"
   
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Ollama AI Configuration
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="phi4-mini"
   OLLAMA_MAX_TOKENS="4000"
   OLLAMA_BATCH_SIZE="10"
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

### 5. Initialize the Database

Run the database migration to create all tables:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## 🔧 Advanced Configuration

### Row Level Security (RLS)

Supabase uses Row Level Security by default. The current schema is designed to work with RLS enabled. Each table has proper user-based filtering:

- **Users**: Can only access their own data
- **Integrations**: Users can only see their own Gmail integrations
- **Tasks**: Tasks are filtered by user_id and integration_id
- **Messages**: Messages are associated with specific integrations
- **Parsed Messages**: Tracking is user-specific

### Authentication

The app uses Google OAuth 2.0 for authentication with automatic token refresh:

- **Google OAuth**: Primary authentication method
- **Token Refresh**: Automatic Gmail API token refresh
- **Multi-Account**: Support for multiple Gmail accounts per user
- **Session Management**: Supabase handles session persistence

### Real-time Features

Supabase provides real-time subscriptions. You can enable this for:
- Live task updates
- Real-time notifications
- Collaborative features

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Integrations Table (Account Keychain)
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  account_email VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, account_email)
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(20) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  due_date DATE,
  source VARCHAR(50) DEFAULT 'gmail',
  account_email VARCHAR(255),
  account_name VARCHAR(255),
  message_id VARCHAR(255),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  message_id VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  sender VARCHAR(255),
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, message_id)
);
```

#### Parsed Messages Table
```sql
CREATE TABLE parsed_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  message_id VARCHAR(255) NOT NULL,
  parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, message_id)
);
```

### Indexes for Performance
```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_integration_id ON tasks(integration_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_integration_id ON messages(integration_id);
CREATE INDEX IF NOT EXISTS idx_parsed_messages_integration_id ON parsed_messages(integration_id);
```

## 🛠 Troubleshooting

### Connection Issues

If you can't connect to Supabase:

1. **Check your credentials**: Ensure all keys are correct
2. **Verify project status**: Make sure your project is active
3. **Check network**: Ensure your network allows HTTPS connections
4. **Database password**: Verify the password in the connection string

### Migration Issues

If database migrations fail:

1. **Check permissions**: Ensure your service role key has write access
2. **Verify schema**: Make sure the schema is compatible
3. **Reset if needed**: You can reset the database in Supabase dashboard

### Common Errors

- **"Invalid API key"**: Check your service role key
- **"Connection refused"**: Verify your project URL
- **"Permission denied"**: Ensure RLS policies are configured correctly
- **"Column not found"**: Run migrations to ensure schema is up to date

### Rate Limiting Issues

If you encounter Gmail API rate limiting:

1. **Check API quotas**: Monitor your Gmail API usage in Google Cloud Console
2. **Adjust delays**: The app includes built-in rate limiting
3. **Batch processing**: AI processing is batched for efficiency
4. **Token refresh**: Automatic token refresh prevents authentication issues

## 📊 Monitoring

### Database Usage

Monitor your database usage in the Supabase dashboard:
- **Storage**: Check table sizes and growth
- **Bandwidth**: Monitor API requests
- **Performance**: View query performance

### Logs

Access logs in the Supabase dashboard:
- **API logs**: View all API requests
- **Database logs**: Monitor database queries
- **Auth logs**: Track authentication events

### Performance Metrics

Track application performance:
- **Task extraction speed**: Monitor AI processing times
- **Gmail API usage**: Track API quota consumption
- **User activity**: Monitor user engagement

## 🔒 Security Best Practices

1. **Never commit secrets**: Keep your `.env` file out of version control
2. **Use environment variables**: Store all secrets in environment variables
3. **Regular key rotation**: Rotate your API keys periodically
4. **Monitor access**: Regularly check your API usage logs
5. **Backup data**: Set up regular database backups
6. **RLS policies**: Ensure proper Row Level Security is configured
7. **Token security**: Store OAuth tokens securely with automatic refresh

## 📈 Scaling

As your app grows:

1. **Upgrade plan**: Consider upgrading your Supabase plan
2. **Optimize queries**: Use indexes and optimize your database queries
3. **Caching**: Implement caching for frequently accessed data
4. **CDN**: Use Supabase's CDN for static assets
5. **Rate limiting**: Monitor and adjust Gmail API rate limits
6. **Batch processing**: Optimize AI batch sizes for your use case

## 🔄 Multi-Account Features

### Account Keychain Management
- **Multiple Gmail Accounts**: Users can connect multiple Gmail accounts
- **Account Toggle**: Enable/disable specific accounts for task extraction
- **Account Removal**: Remove accounts from the keychain
- **Account Association**: Tasks are linked to their source Gmail account

### Performance Optimization
- **Batch Processing**: Efficient AI task extraction from multiple messages
- **Rate Limiting**: Smart delays prevent Gmail API quota exhaustion
- **Token Refresh**: Automatic Gmail API token refresh
- **Message Tracking**: Avoid reprocessing already parsed messages

## 🆘 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)

## 🚀 Next Steps

After setting up Supabase:

1. **Configure Google OAuth**: See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
2. **Set up Ollama**: Install and configure local AI processing
3. **Test the application**: Verify all features are working
4. **Monitor performance**: Track usage and optimize as needed
5. **Deploy to production**: Set up production environment
