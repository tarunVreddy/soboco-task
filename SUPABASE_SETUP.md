# Supabase Setup Guide

This guide will help you set up Supabase for the SoBoCo Task Management App.

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
   
   # Other settings...
   PORT=3000
   NODE_ENV=development
   ```

### 5. Initialize the Database

Run the database migration to create all tables:

```bash
npm run db:push
```

## 🔧 Advanced Configuration

### Row Level Security (RLS)

Supabase uses Row Level Security by default. The current schema is designed to work with RLS enabled. Each table has proper user-based filtering.

### Authentication

The app uses its own JWT-based authentication system, but you can optionally integrate Supabase Auth for additional features.

### Real-time Features

Supabase provides real-time subscriptions. You can enable this for:
- Live task updates
- Real-time notifications
- Collaborative features

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
2. **Verify schema**: Make sure the Prisma schema is compatible
3. **Reset if needed**: You can reset the database in Supabase dashboard

### Common Errors

- **"Invalid API key"**: Check your service role key
- **"Connection refused"**: Verify your project URL
- **"Permission denied"**: Ensure RLS policies are configured correctly

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

## 🔒 Security Best Practices

1. **Never commit secrets**: Keep your `.env` file out of version control
2. **Use environment variables**: Store all secrets in environment variables
3. **Regular key rotation**: Rotate your API keys periodically
4. **Monitor access**: Regularly check your API usage logs
5. **Backup data**: Set up regular database backups

## 📈 Scaling

As your app grows:

1. **Upgrade plan**: Consider upgrading your Supabase plan
2. **Optimize queries**: Use indexes and optimize your Prisma queries
3. **Caching**: Implement caching for frequently accessed data
4. **CDN**: Use Supabase's CDN for static assets

## 🆘 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
