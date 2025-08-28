import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Task Management Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
              <Link 
                to="/profile" 
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Profile
              </Link>
              <Link 
                to="/integrations" 
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Integrations
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Task Management App</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              This is where you'll manage your tasks extracted from various sources like Gmail, Slack, and more.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Integration</h3>
              <p className="text-gray-600 mb-4">
                Connect your Gmail, Microsoft 365, or Exchange accounts to automatically extract tasks from emails.
              </p>
              <Link 
                to="/integrations"
                className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Connect Now
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Slack Integration</h3>
              <p className="text-gray-600 mb-4">
                Connect your Slack workspace to extract tasks from messages and conversations.
              </p>
              <button className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Task Extraction</h3>
              <p className="text-gray-600 mb-4">
                Our AI automatically identifies and extracts actionable tasks from your messages.
              </p>
              <button className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Management</h3>
              <p className="text-gray-600 mb-4">
                Review, edit, and manage all your extracted tasks in one place.
              </p>
              <button className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
