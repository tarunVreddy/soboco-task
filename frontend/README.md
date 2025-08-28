# SoBoCo Task Management App - Frontend

This is the React frontend for the SoBoCo Task Management App, a modern web application that automatically extracts tasks from Gmail messages using AI processing.

## 🚀 Features

- **Modern React** with TypeScript for type safety
- **TailwindCSS** for beautiful, responsive design
- **Google OAuth 2.0** authentication
- **Multi-account keychain** for managing multiple Gmail accounts
- **Real-time task extraction** from email messages
- **Account management** with integration toggling
- **Responsive design** for all screen sizes
- **Modern UI/UX** with loading states and error handling

## 🛠 Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **TailwindCSS** for styling
- **Modern ES6+** JavaScript features

## 📋 Prerequisites

Before running the frontend, make sure you have:

1. **Node.js** (v16 or higher)
2. **Backend server** running (see main README.md)
3. **Supabase project** configured
4. **Google OAuth** credentials set up

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

The frontend uses environment variables from the main project. Make sure your `.env` file in the project root includes:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server Configuration
PORT=3000
```

### 3. Start Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Header.tsx      # Navigation header
│   │   ├── Integrations.tsx # Account keychain
│   │   ├── Login.tsx       # Authentication
│   │   ├── Profile.tsx     # User profile
│   │   ├── Register.tsx    # User registration
│   │   └── TaskList.tsx    # Task display
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── utils/              # Utility functions
│   │   └── supabase.ts     # Supabase client
│   ├── App.tsx             # Main app component
│   ├── index.tsx           # App entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies
├── tailwind.config.js      # TailwindCSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎨 UI Components

### Dashboard
- **Task Overview**: Display extracted tasks with account association
- **Gmail Integration**: Show message counts and parsing status
- **Quick Actions**: Parse tasks, reset tracking, manage accounts

### Account Keychain
- **Multi-Account Management**: Add, remove, and toggle Gmail accounts
- **Account Status**: Show active/inactive status and message counts
- **OAuth Integration**: Seamless Google account connection

### Task Management
- **Task Display**: Show tasks with source account information
- **Task Details**: Title, description, priority, and confidence
- **Account Association**: Link tasks to specific Gmail accounts

## 🔧 Available Scripts

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

## 🎯 Key Features

### Authentication
- **Google OAuth 2.0**: Secure authentication with Google accounts
- **Session Management**: Automatic session persistence
- **User Registration**: Simple user onboarding process

### Multi-Account Support
- **Account Keychain**: Manage multiple Gmail accounts
- **Account Toggle**: Enable/disable specific accounts
- **Account Association**: Tasks linked to source accounts

### Task Extraction
- **AI-Powered**: Automatic task extraction from Gmail messages
- **Batch Processing**: Efficient processing of multiple messages
- **Account Tracking**: Tasks show which account they came from

### Modern UI/UX
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Smooth user experience during operations
- **Error Handling**: Clear error messages and recovery options
- **Accessibility**: Proper focus states and keyboard navigation

## 🔄 API Integration

The frontend communicates with the backend API for:

- **Authentication**: User login/logout and session management
- **Gmail Integration**: Fetch messages and account information
- **Task Management**: Get, create, and manage tasks
- **Account Management**: Add, remove, and toggle integrations

## 🎨 Styling

The app uses **TailwindCSS** for styling with:

- **Modern Design**: Clean, professional appearance
- **Responsive Layout**: Mobile-first design approach
- **Consistent Theming**: Unified color scheme and typography
- **Interactive Elements**: Hover states and transitions

## 🚀 Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### Static Hosting

The build folder can be deployed to any static hosting service:
- **Vercel**: Automatic deployment from Git
- **Netlify**: Drag and drop deployment
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for open source projects

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `REACT_APP_API_URL` | Backend API URL | Yes |

### TailwindCSS Configuration

The app uses a custom TailwindCSS configuration in `tailwind.config.js` with:
- **Custom colors**: Brand-specific color palette
- **Responsive breakpoints**: Mobile-first design
- **Custom components**: Reusable UI components

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

The app includes:
- **Component testing**: React component unit tests
- **Integration testing**: API integration tests
- **User flow testing**: End-to-end user scenarios

## 📚 Learn More

- **React Documentation**: [reactjs.org](https://reactjs.org/)
- **TypeScript Documentation**: [typescriptlang.org](https://www.typescriptlang.org/)
- **TailwindCSS Documentation**: [tailwindcss.com](https://tailwindcss.com/)
- **Create React App**: [facebook.github.io/create-react-app](https://facebook.github.io/create-react-app/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
