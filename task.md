# Task Management App Prompt (TypeScript/Node.js)

You are helping me build a **task management app** in **TypeScript/Node.js**. Please follow these requirements.

---

## Core Product
- **Multi-user** web-based task management app (mobile app may come later).
- The app automatically pulls tasks from:
  - Slack messages
  - Multiple email accounts (Gmail, Microsoft 365, Exchange).
- An **AI pipeline** will parse and extract potential tasks from those messages.
- **Automatic monitoring**: Background processes watch for new messages and extract tasks in real-time.
- Users can review, accept, edit, and manage tasks.
- **User authentication**: Login system with session management.

---

## Technical Stack
- **Backend**: Node.js + TypeScript with Express (chosen for simplicity and extensive middleware ecosystem).
- **Frontend**: React with TypeScript (basic scaffold; focus mainly on backend APIs).
- **Database**: Supabase (direct client integration, no ORM needed).
- **Auth**: User registration/login + OAuth2 for Slack, Gmail, Microsoft 365/Exchange.
- **Background Jobs**: Node-cron for scheduled message monitoring.
- **Deployment**: Must run easily on a **local Linux box** via `npm run dev`.

---

## AI Integration
- Create a **pluggable AI backend layer**:
  - Define an interface (e.g., `IAIProvider` with `extractTasks(message: string): Task[]`).
  - Initial provider must be **Ollama**, connecting to a locally running Ollama server (e.g., `http://localhost:11434/api/generate`).
  - Include configuration for switching providers later (e.g., OpenAI, Gemini).

---

## Development Guidelines
- Prioritize **clarity, modularity, and maintainability**.
- Folder structure should separate concerns clearly.
- Use environment-based configuration (`dotenv`).
- Provide database schema covering:
  - Users (with Social Logins for Google and Microsoft only via Supabase)
  - Tasks
  - Integrations
  - Messages
  - User sessions
- Generate initial scaffolding (services, models, database service layer, API routes).
- Write example integration services for **Slack** and **Gmail** that:
  - Handle OAuth2 login
  - Fetch recent messages
  - Pass messages to the AI pipeline for task extraction
- Implement **background monitoring**:
  - Scheduled jobs to check for new messages
  - Real-time task extraction for each user
  - Notification system for new tasks
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
    /monitoring
    /database      # Supabase database service layer
  /integrations
    /slack
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
3. **User authentication system** (registration, login, session management).
4. **Working Slack connector** (OAuth + fetch messages).
5. **Working Gmail connector** (OAuth + fetch messages).
6. **Background monitoring system** (scheduled message checking).
7. AI service interface with **Ollama provider** (calls local server on `localhost:11434`).
8. **React frontend** with login screen and task management interface.
9. Documentation for adding new AI providers (OpenAI, Gemini) or new integrations.
10. Setup instructions (install deps, configure Supabase, start app locally on Linux, connect to Ollama).

---

## Current Implementation Status ✅

### Completed Features
- ✅ **Project scaffold** with TypeScript/Node.js and Express
- ✅ **Supabase integration** with direct client usage (no Prisma)
- ✅ **Database service layer** with TypeScript interfaces
- ✅ **User authentication system** (registration, login, session management)
- ✅ **Google OAuth integration** via Supabase Auth
- ✅ **AI service interface** with Ollama provider
- ✅ **React frontend** with modern TailwindCSS design
- ✅ **Profile management** with password change functionality
- ✅ **Email integrations** (Gmail connector with OAuth setup)
- ✅ **Single-server architecture** (API + static frontend)
- ✅ **Interactive setup script** for database configuration
- ✅ **Comprehensive documentation** (README, Supabase setup guide, Google OAuth guide)

### Technical Implementation
- **Database**: Supabase with direct client integration
- **Authentication**: Supabase Auth with Google OAuth support
- **Frontend**: React with TypeScript and TailwindCSS
- **AI Integration**: Pluggable interface with Ollama provider
- **Architecture**: Single Express server serving both API and React app
- **Configuration**: Environment-based with interactive setup
- **Styling**: Modern TailwindCSS design system with responsive layout

### UI/UX Improvements
- ✅ **Modern design** with TailwindCSS
- ✅ **Consistent color scheme** and typography
- ✅ **Responsive layout** for all screen sizes
- ✅ **Professional navigation** with back buttons
- ✅ **Clean forms** with proper validation states
- ✅ **Loading states** and error handling
- ✅ **Accessibility improvements** with focus states

### Current Issues
- ⚠️ **Server startup issue** with route parameter parsing (path-to-regexp error)
- ⚠️ **Need to resolve** the route configuration to complete single-server setup

### Next Steps
- 🔄 **Fix server startup issue** and complete single-server setup
- 🔄 **Slack integration** with OAuth
- 🔄 **Microsoft 365/Exchange integration**
- 🔄 **Background monitoring system**
- 🔄 **Task management interface**
- 🔄 **Real-time notifications**
- 🔄 **Gmail API integration** (currently placeholder, needs actual token handling)
