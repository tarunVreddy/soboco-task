# Task Management App Prompt (TypeScript/Node.js)

You are helping me build a **task management app** in **TypeScript/Node.js**. Please follow these requirements.

---

## Core Product
- **Multi-user** web-based task management app (mobile app may come later).
- The app automatically pulls tasks from:
  - Gmail messages (multiple accounts supported)
  - Slack messages (planned)
  - Microsoft 365/Exchange (planned).
- An **AI pipeline** will parse and extract potential tasks from those messages.
- **Automatic monitoring**: Background processes watch for new messages and extract tasks in real-time.
- Users can review, accept, edit, and manage tasks.
- **User authentication**: Google OAuth 2.0 with automatic token refresh.

---

## Technical Stack
- **Backend**: Node.js + TypeScript with Express (chosen for simplicity and extensive middleware ecosystem).
- **Frontend**: React with TypeScript and TailwindCSS (modern, responsive design).
- **Database**: Supabase (direct client integration, no ORM needed).
- **Auth**: Google OAuth 2.0 for Gmail integration with automatic token refresh.
- **Background Jobs**: Efficient batch processing for AI task extraction.
- **Deployment**: Must run easily on a **local Linux box** via `npm run dev`.

---

## AI Integration
- Create a **pluggable AI backend layer**:
  - Define an interface (e.g., `IAIProvider` with `extractTasks(message: string): Task[]`).
  - Initial provider must be **Ollama**, connecting to a locally running Ollama server (e.g., `http://localhost:11434/api/generate`).
  - Include configuration for switching providers later (e.g., OpenAI, Gemini).
  - **Batch processing** for efficient task extraction from multiple messages.

---

## Development Guidelines
- Prioritize **clarity, modularity, and maintainability**.
- Folder structure should separate concerns clearly.
- Use environment-based configuration (`dotenv`).
- Provide database schema covering:
  - Users (with Google OAuth via Supabase)
  - Tasks (with account association)
  - Integrations (multi-account keychain)
  - Messages (with parsing tracking)
  - User sessions
- Generate initial scaffolding (services, models, database service layer, API routes).
- Write example integration services for **Gmail** that:
  - Handle OAuth2 login with automatic token refresh
  - Fetch recent messages with rate limiting
  - Pass messages to the AI pipeline for batch task extraction
- Implement **background monitoring**:
  - Batch processing for efficient AI task extraction
  - Real-time task extraction for each user
  - Rate limiting and error handling
- Document how to add new integrations or AI providers.

---

## Suggested Folder Structure
```
/src
  /api
    /routes
    /controllers
  /services
    /auth
    /tasks
    /users
    /gmail
    /database      # Supabase database service layer
  /integrations
    /gmail
    /microsoft
  /ai
    /providers
      /ollama
      /openai   # stub
    /interfaces
  /db              # Database connection utilities
  /config
  /utils
  /middleware
/frontend
```

---

## Deliverables
1. Initial project scaffold in TypeScript/Node.
2. Supabase database service layer with TypeScript interfaces for users, tasks, integrations, and messages.
3. **User authentication system** (Google OAuth 2.0 with token refresh).
4. **Working Gmail connector** (OAuth + fetch messages + rate limiting).
5. **Background monitoring system** (batch processing for task extraction).
6. AI service interface with **Ollama provider** (calls local server on `localhost:11434`).
7. **React frontend** with login screen and task management interface.
8. Documentation for adding new AI providers (OpenAI, Gemini) or new integrations.
9. Setup instructions (install deps, configure Supabase, start app locally on Linux, connect to Ollama).

---

## Current Implementation Status ✅

### Completed Features
- ✅ **Project scaffold** with TypeScript/Node.js and Express
- ✅ **Supabase integration** with direct client usage (no Prisma)
- ✅ **Database service layer** with TypeScript interfaces
- ✅ **User authentication system** (Google OAuth 2.0 with token refresh)
- ✅ **Google OAuth integration** via Supabase Auth
- ✅ **AI service interface** with Ollama provider and batch processing
- ✅ **React frontend** with modern TailwindCSS design
- ✅ **Profile management** with password change functionality
- ✅ **Gmail integrations** (OAuth 2.0 with automatic token refresh)
- ✅ **Multi-account keychain** for managing multiple Gmail accounts
- ✅ **Single-server architecture** (API + static frontend)
- ✅ **Interactive setup script** for database configuration
- ✅ **Comprehensive documentation** (README, Supabase setup guide, Google OAuth guide)
- ✅ **Rate limiting** and automatic retry for Gmail API
- ✅ **Batch processing** for efficient AI task extraction
- ✅ **Task management** with account association
- ✅ **Account management** with integration toggling

### Technical Implementation
- **Database**: Supabase with direct client integration
- **Authentication**: Google OAuth 2.0 with automatic token refresh
- **Frontend**: React with TypeScript and TailwindCSS
- **AI Integration**: Ollama with batch processing and configurable models
- **Architecture**: Single Express server serving both API and React app
- **Configuration**: Environment-based with interactive setup
- **Styling**: Modern TailwindCSS design system with responsive layout
- **Rate Limiting**: Smart delays and retry logic for Gmail API
- **Multi-Account**: Keychain system for managing multiple Gmail accounts

### UI/UX Improvements
- ✅ **Modern design** with TailwindCSS
- ✅ **Consistent color scheme** and typography
- ✅ **Responsive layout** for all screen sizes
- ✅ **Professional navigation** with back buttons
- ✅ **Clean forms** with proper validation states
- ✅ **Loading states** and error handling
- ✅ **Accessibility improvements** with focus states
- ✅ **Account keychain** interface for managing multiple Gmail accounts
- ✅ **Task management** with account association display

### Performance Features
- ✅ **Batch processing** for efficient AI task extraction
- ✅ **Rate limiting** to prevent API quota exhaustion
- ✅ **Token refresh** for continuous Gmail API access
- ✅ **Configurable AI models** (phi4, phi4-mini, qwen3:0.6b)
- ✅ **Smart message tracking** to avoid reprocessing
- ✅ **Multi-account processing** with intelligent delays

### API Endpoints
- ✅ **Authentication**: Register, login, logout, user info
- ✅ **Gmail Integration**: Profile, messages, message counts
- ✅ **Task Management**: Get tasks, parse Gmail, reset tracking
- ✅ **Integrations**: Get integrations, remove, toggle, add account
- ✅ **Health Check**: Application status

### Database Schema
- ✅ **Users table** with OAuth integration
- ✅ **Sessions table** for user sessions
- ✅ **Integrations table** for account keychain
- ✅ **Tasks table** with account association
- ✅ **Messages table** for message tracking
- ✅ **Parsed messages table** for tracking processed messages

### Current Issues Resolved
- ✅ **Server startup issue** with route parameter parsing (path-to-regexp error)
- ✅ **Rate limiting** for Gmail API (429 errors)
- ✅ **Token refresh** for continuous Gmail access
- ✅ **Multi-account processing** with proper delays
- ✅ **Batch processing** for efficient AI task extraction
- ✅ **Database schema** with proper relationships

### Next Steps
- 🔄 **Slack integration** with OAuth
- 🔄 **Microsoft 365/Exchange integration**
- 🔄 **Background monitoring system** (scheduled message checking)
- 🔄 **Real-time notifications**
- 🔄 **Advanced task management** (due dates, priorities, categories)
- 🔄 **Mobile app support**

### Environment Configuration
- ✅ **Supabase setup** with proper credentials
- ✅ **Google OAuth** configuration
- ✅ **Ollama integration** with configurable models
- ✅ **Rate limiting** configuration
- ✅ **Batch processing** settings
- ✅ **Development and production** environment support
