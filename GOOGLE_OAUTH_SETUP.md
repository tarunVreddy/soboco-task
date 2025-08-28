# Google OAuth Setup with Supabase

This guide will help you set up Google OAuth authentication using Supabase instead of username/password login.

## Prerequisites

1. A Supabase project (already configured)
2. A Google Cloud Console project

## Step 1: Configure Google OAuth

### 1.1 Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set the following:
   - **Name**: Your app name (e.g., "Task Management App")
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/dashboard` (for development)

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

## Step 3: Update Frontend Environment

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:3001/api
```

### How to get Supabase credentials:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

## Step 4: Test the Setup

1. Start your frontend: `cd frontend && npm start`
2. Go to `http://localhost:3000`
3. Click **Continue with Google** button
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your dashboard

## Features

### ✅ What's Working Now:

1. **Google OAuth Login**: Users can sign in with their Google account
2. **Automatic User Creation**: New users are automatically created in Supabase
3. **Session Management**: Supabase handles session persistence
4. **Secure Authentication**: All OAuth flows are handled securely by Supabase

### 🔄 What Changed:

1. **Frontend**: Now uses Supabase Auth instead of custom backend auth
2. **Backend**: Still available for API calls (integrations, tasks, etc.)
3. **Database**: Users are stored in Supabase's `auth.users` table
4. **Session**: Managed by Supabase with automatic token refresh

## Benefits of Using Supabase Auth

1. **Security**: Industry-standard OAuth implementation
2. **Simplicity**: No need to handle OAuth flows manually
3. **Features**: Built-in session management, password reset, email verification
4. **Scalability**: Handles authentication at scale
5. **Compliance**: GDPR, SOC2 compliant

## Next Steps

After setting up Google OAuth:

1. **Test the flow** with your Google account
2. **Configure additional providers** (Microsoft, GitHub, etc.) if needed
3. **Customize the OAuth consent screen** in Google Cloud Console
4. **Set up production redirect URLs** when deploying

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Console matches Supabase
2. **"Client ID not found"**: Verify your Google Client ID is correct
3. **"Redirect loop"**: Check that your frontend environment variables are set correctly

### Debug Steps:

1. Check browser console for errors
2. Verify Supabase project URL and anon key
3. Ensure Google OAuth is enabled in Supabase dashboard
4. Check that redirect URIs are properly configured

## Security Notes

- Never commit your `.env` files to version control
- Use environment variables in production
- Regularly rotate your OAuth client secrets
- Monitor OAuth usage in Google Cloud Console
