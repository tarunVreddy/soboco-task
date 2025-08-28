# SoBoCo Task Management App

An AI-powered task management application that automatically extracts tasks from Slack messages, emails (Gmail, Microsoft 365, Exchange), and other sources using local AI processing.

## 🚀 Features

- **Multi-user authentication** with email/password and social login support
- **AI-powered task extraction** using local Ollama server
- **Multi-source integration** (Slack, Gmail, Microsoft 365/Exchange)
- **Real-time monitoring** of messages for task extraction
- **Modern React frontend** with beautiful UI
- **TypeScript backend** with Express and Prisma ORM
- **PostgreSQL database** with comprehensive schema

## 🛠 Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Express.js** web framework
- **Prisma ORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **node-cron** for background jobs

### Frontend
- **React** + **TypeScript**
- **React Router** for navigation
- **Axios** for API communication
- **Modern CSS** with responsive design

### AI Integration
- **Ollama** for local AI processing
- **Pluggable AI provider interface** for easy switching

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v16 or higher)
2. **Supabase** project (recommended) or **PostgreSQL** database
3. **Ollama** server running locally (optional for AI features)

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

### 4. Start the Application

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

### 5. Access the Application

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
3. **Pull a model** (e.g., llama2):
   ```bash
   ollama pull llama2
   ```
4. **Update environment variables**:
   ```env
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="llama2"
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
    /monitoring     # Background monitoring service
  /integrations
    /slack          # Slack integration
    /gmail          # Gmail integration
    /microsoft      # Microsoft integration
  /ai
    /providers      # AI provider implementations
    /interfaces     # AI provider interfaces
  /db              # Database connection and utilities
  /config          # Configuration management
  /utils           # Utility functions
  /middleware      # Express middleware
/frontend          # React frontend application
/prisma            # Database schema and migrations
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | - |
| `SUPABASE_DB_PASSWORD` | Supabase database password | - |
| `DATABASE_URL` | PostgreSQL connection string (auto-generated for Supabase) | - |
| `JWT_SECRET` | JWT signing secret | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `OLLAMA_BASE_URL` | Ollama server URL | http://localhost:11434 |
| `OLLAMA_MODEL` | Ollama model name | llama2 |

### OAuth Configuration

For full functionality, configure OAuth credentials for:
- **Slack**: `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`
- **Gmail**: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`
- **Microsoft**: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`

## 🧪 Testing the Application

1. **Register a new account** at http://localhost:3000/register
2. **Login** with your credentials
3. **Explore the dashboard** to see the task management interface

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Health Check
- `GET /health` - Application health status

## 🚧 Coming Soon

- [ ] Slack integration with OAuth
- [ ] Gmail integration with OAuth
- [ ] Microsoft 365/Exchange integration
- [ ] Background message monitoring
- [ ] Task management interface
- [ ] Real-time notifications
- [ ] Mobile app support

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
