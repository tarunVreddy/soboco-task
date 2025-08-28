# SoBoCo Task Management App

An AI-powered task management application that automatically extracts tasks from Gmail messages using local AI processing with support for multiple accounts and advanced rate limiting.

## 🚀 Features

- **Multi-user authentication** with Google OAuth 2.0
- **AI-powered task extraction** using local Ollama server with batch processing
- **Multi-account Gmail integration** with account keychain support
- **Automatic rate limiting** and token refresh for Gmail API
- **Real-time task extraction** from email messages
- **Modern React frontend** with beautiful UI
- **TypeScript backend** with Express and Supabase
- **PostgreSQL database** with comprehensive schema
- **Batch processing** for efficient AI task extraction
- **Account management** with integration toggling

## 🛠 Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Express.js** web framework
- **Supabase** for database and authentication
- **PostgreSQL** database
- **JWT** for authentication
- **Google OAuth 2.0** for Gmail integration
- **Ollama** for local AI processing

### Frontend
- **React** + **TypeScript**
- **React Router** for navigation
- **Axios** for API communication
- **TailwindCSS** for styling
- **Modern responsive design**

### AI Integration
- **Ollama** for local AI processing
- **Pluggable AI provider interface** for easy switching
- **Batch processing** for efficient task extraction
- **Configurable models** (phi4, phi4-mini, qwen3:0.6b)

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v16 or higher)
2. **Supabase** project (recommended) or **PostgreSQL** database
3. **Ollama** server running locally (optional for AI features)
4. **Google Cloud Console** project for OAuth credentials

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd soboco-task

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Database Setup

#### Option A: Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials from the Settings > API page
3. Copy the environment template:
   ```bash
   cp env.example .env
   ```
4. Update the `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   SUPABASE_DB_PASSWORD="your-database-password"
   DATABASE_URL="postgresql://postgres:your-database-password@db.your-project-id.supabase.co:5432/postgres"
   JWT_SECRET="your-super-secret-jwt-key-here"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="phi4-mini"
   OLLAMA_MAX_TOKENS="4000"
   OLLAMA_BATCH_SIZE="10"
   ```
   
   **Or use the interactive setup script:**
   ```bash
   npm run setup:db
   ```

#### Option B: Local PostgreSQL

1. Create a PostgreSQL database
2. Copy the environment template:
   ```bash
   cp env.example .env
   ```
3. Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/soboco_task"
   JWT_SECRET="your-super-secret-jwt-key-here"
   ```

### 3. Database Setup

#### For Supabase (Recommended):
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Push migrations: `supabase db push`

#### Manual Setup (Alternative):
1. Go to your Supabase dashboard > SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create all tables

### 4. Google OAuth Setup

1. Create a Google Cloud Console project
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Configure authorized redirect URIs
5. Update your `.env` file with Google credentials

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.

### 5. Start the Application

#### Development Mode

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🤖 AI Setup (Optional)

To enable AI-powered task extraction:

1. **Install Ollama**: Follow instructions at [ollama.ai](https://ollama.ai)
2. **Start Ollama server**:
   ```bash
   ollama serve
   ```
3. **Pull a model** (recommended: phi4-mini for speed/quality balance):
   ```bash
   ollama pull phi4-mini
   ```
4. **Update environment variables**:
   ```env
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="phi4-mini"
   OLLAMA_MAX_TOKENS="4000"
   OLLAMA_BATCH_SIZE="10"
   ```

## 📁 Project Structure

```
/src
  /api
    /routes          # API route definitions
    /controllers     # Request handlers
  /services
    /auth           # Authentication service
    /tasks          # Task management service
    /users          # User management service
    /gmail          # Gmail integration service
    /database       # Supabase database service layer
  /integrations
    /gmail          # Gmail integration
    /microsoft      # Microsoft integration (planned)
  /ai
    /providers      # AI provider implementations
    /interfaces     # AI provider interfaces
  /db              # Database connection and utilities
  /config          # Configuration management
  /utils           # Utility functions
  /middleware      # Express middleware
/frontend          # React frontend application
/supabase          # Database migrations and schema
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | - |
| `SUPABASE_DB_PASSWORD` | Supabase database password | - |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `OLLAMA_BASE_URL` | Ollama server URL | http://localhost:11434 |
| `OLLAMA_MODEL` | Ollama model name | phi4-mini |
| `OLLAMA_MAX_TOKENS` | Maximum tokens for AI prompts | 4000 |
| `OLLAMA_BATCH_SIZE` | Batch size for AI processing | 10 |

## 🧪 Testing the Application

1. **Register a new account** at http://localhost:3000/register
2. **Login** with your credentials
3. **Add Gmail accounts** via the Account Keychain
4. **Parse tasks** from your Gmail messages
5. **Manage tasks** in the dashboard

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Gmail Integration
- `GET /api/gmail/profile` - Get Gmail profile
- `GET /api/gmail/messages` - Get Gmail messages
- `GET /api/gmail/message-counts` - Get message counts for all accounts

### Task Management
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks/parse-gmail` - Parse Gmail for tasks
- `POST /api/tasks/reset-tracking` - Reset message tracking
- `GET /api/tasks/unparsed-count` - Get unparsed message count

### Integrations
- `GET /api/integrations` - Get user integrations
- `DELETE /api/integrations/:id` - Remove integration
- `PUT /api/integrations/:id/toggle` - Toggle integration
- `GET /api/integrations/add-account-url` - Get OAuth URL

### Health Check
- `GET /health` - Application health status

## 🚧 Current Implementation Status ✅

### Completed Features
- ✅ **Multi-user authentication** with Google OAuth 2.0
- ✅ **Gmail integration** with OAuth 2.0 and token refresh
- ✅ **Multi-account keychain** for managing multiple Gmail accounts
- ✅ **AI-powered task extraction** using Ollama with batch processing
- ✅ **Rate limiting** and automatic retry for Gmail API
- ✅ **Task management** with account association
- ✅ **Modern React frontend** with TailwindCSS
- ✅ **Database schema** with proper relationships
- ✅ **Background processing** for efficient task extraction
- ✅ **Comprehensive error handling** and logging

### Technical Implementation
- **Database**: Supabase with direct client integration
- **Authentication**: Google OAuth 2.0 with automatic token refresh
- **Frontend**: React with TypeScript and TailwindCSS
- **AI Integration**: Ollama with batch processing and configurable models
- **Architecture**: Single Express server serving both API and React app
- **Rate Limiting**: Smart delays and retry logic for Gmail API
- **Multi-Account**: Keychain system for managing multiple Gmail accounts

### Performance Features
- ✅ **Batch processing** for efficient AI task extraction
- ✅ **Rate limiting** to prevent API quota exhaustion
- ✅ **Token refresh** for continuous Gmail API access
- ✅ **Configurable AI models** (phi4, phi4-mini, qwen3:0.6b)
- ✅ **Smart message tracking** to avoid reprocessing

### Next Steps
- 🔄 **Slack integration** with OAuth
- 🔄 **Microsoft 365/Exchange integration**
- 🔄 **Real-time notifications**
- 🔄 **Mobile app support**
- 🔄 **Advanced task management** (due dates, priorities, categories)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Note**: This is a development version. Production deployment requires additional security measures and environment-specific configurations.
