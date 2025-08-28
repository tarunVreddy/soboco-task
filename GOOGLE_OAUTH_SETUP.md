# Google OAuth Setup with Supabase

This guide will help you set up Google OAuth authentication using Supabase for the SoBoCo Task Management App, including multi-account keychain support and Gmail API integration.

## Prerequisites

1. A Supabase project (already configured)
2. A Google Cloud Console project
3. Node.js and npm installed

## Step 1: Configure Google OAuth

### 1.1 Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Gmail API** (for email integration)
   - **Google+ API** (for authentication)

### 1.2 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set the following:
   - **Name**: Your app name (e.g., "SoBoCo Task Management App")
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/dashboard` (for development)
     - `http://localhost:3000/integrations` (for account keychain)

### 1.3 Copy Credentials

After creating, you'll get:
- **Client ID**: Copy this
- **Client Secret**: Copy this

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Enable**
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
5. Click **Save**

### 2.2 Configure Redirect URLs

In the same Google provider settings:
- **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`

## Step 3: Update Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_PASSWORD=your_database_password
DATABASE_URL=postgresql://postgres:your_database_password@db.your-project.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Ollama AI Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi4-mini
OLLAMA_MAX_TOKENS=4000
OLLAMA_BATCH_SIZE=10

# Server Configuration
PORT=3000
NODE_ENV=development
```

### How to get Supabase credentials:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
4. Navigate to **Settings** → **Database**
5. Copy your database password → `SUPABASE_DB_PASSWORD`

## Step 4: Database Setup

### 4.1 Run Database Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push database migrations
supabase db push
```

### 4.2 Verify Database Schema

The migrations will create the following tables:
- `users` - User accounts
- `sessions` - User sessions
- `integrations` - Gmail account integrations (keychain)
- `tasks` - Extracted tasks with account association
- `messages` - Gmail messages
- `parsed_messages` - Tracking for processed messages

## Step 5: Test the Setup

### 5.1 Start the Application

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

### 5.2 Test the Flow

1. Go to `http://localhost:3000`
2. Click **Register** or **Login**
3. Choose **Continue with Google**
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected to your dashboard

## Features

### ✅ What's Working Now:

1. **Google OAuth Login**: Users can sign in with their Google account
2. **Multi-Account Keychain**: Add multiple Gmail accounts to a single user
3. **Automatic Token Refresh**: Gmail API tokens are automatically refreshed
4. **Rate Limiting**: Smart delays prevent Gmail API quota exhaustion
5. **Batch Processing**: Efficient AI task extraction from multiple messages
6. **Account Management**: Toggle integrations on/off, remove accounts
7. **Task Association**: Tasks are linked to specific Gmail accounts
8. **Session Management**: Supabase handles session persistence

### 🔄 What Changed:

1. **Frontend**: Uses Supabase Auth for authentication
2. **Backend**: Handles Gmail API integration with rate limiting
3. **Database**: Users stored in Supabase's `auth.users` table
4. **Integrations**: Gmail accounts stored in `integrations` table
5. **Tasks**: Associated with specific integrations via `integration_id`
6. **Session**: Managed by Supabase with automatic token refresh

## Benefits of Using Supabase Auth

1. **Security**: Industry-standard OAuth implementation
2. **Simplicity**: No need to handle OAuth flows manually
3. **Features**: Built-in session management, password reset, email verification
4. **Scalability**: Handles authentication at scale
5. **Compliance**: GDPR, SOC2 compliant

## Multi-Account Keychain Features

### Account Management
- **Add Multiple Gmail Accounts**: Users can connect multiple Gmail accounts
- **Account Toggle**: Enable/disable specific accounts for task extraction
- **Account Removal**: Remove accounts from the keychain
- **Account Association**: Tasks are linked to their source Gmail account

### Rate Limiting & Performance
- **Smart Delays**: 2-second delays between account processing
- **Automatic Retry**: 5-second retry on 429 errors
- **Batch Processing**: Efficient AI task extraction from multiple messages
- **Token Refresh**: Automatic Gmail API token refresh

### Task Extraction
- **Multi-Account Processing**: Parse tasks from all connected accounts
- **Account-Specific Tasks**: Tasks show which Gmail account they came from
- **Message Tracking**: Avoid reprocessing already parsed messages
- **Batch AI Processing**: Send multiple messages to AI for efficient extraction

## Next Steps

After setting up Google OAuth:

1. **Test the flow** with your Google account
2. **Add multiple Gmail accounts** via the Account Keychain
3. **Test task extraction** from multiple accounts
4. **Configure additional providers** (Microsoft, GitHub, etc.) if needed
5. **Customize the OAuth consent screen** in Google Cloud Console
6. **Set up production redirect URLs** when deploying

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Console matches Supabase
2. **"Client ID not found"**: Verify your Google Client ID is correct
3. **"Redirect loop"**: Check that your environment variables are set correctly
4. **"429 Too Many Requests"**: The app includes rate limiting, but you may need to wait
5. **"Token expired"**: The app automatically refreshes tokens, but check your refresh token

### Debug Steps:

1. Check browser console for errors
2. Verify Supabase project URL and anon key
3. Ensure Google OAuth is enabled in Supabase dashboard
4. Check that redirect URIs are properly configured
5. Verify Gmail API is enabled in Google Cloud Console
6. Check server logs for rate limiting or token refresh issues

### Rate Limiting Issues:

If you encounter 429 errors:
1. The app automatically waits 5 seconds and retries
2. Between accounts, there's a 2-second delay
3. You can adjust delays in the environment variables
4. Check your Gmail API quota in Google Cloud Console

## Security Notes

- Never commit your `.env` files to version control
- Use environment variables in production
- Regularly rotate your OAuth client secrets
- Monitor OAuth usage in Google Cloud Console
- The app includes automatic token refresh for security
- Rate limiting prevents API quota exhaustion

## Performance Optimization

### AI Processing
- **Batch Size**: Configurable via `OLLAMA_BATCH_SIZE` (default: 10)
- **Model Selection**: Choose between phi4, phi4-mini, qwen3:0.6b
- **Token Limits**: Configurable via `OLLAMA_MAX_TOKENS` (default: 4000)

### Gmail API
- **Rate Limiting**: Built-in delays prevent quota exhaustion
- **Token Refresh**: Automatic refresh for continuous access
- **Multi-Account**: Efficient processing of multiple accounts

### Database
- **Indexes**: Proper indexing on integration_id and user_id
- **Relationships**: Efficient foreign key relationships
- **Tracking**: Smart message tracking to avoid reprocessing
