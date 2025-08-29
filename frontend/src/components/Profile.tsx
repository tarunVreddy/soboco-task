import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="space-y-8">
          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <span className="text-gray-900 dark:text-white">{user?.email}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <span className="text-gray-900 dark:text-white">{user?.name || 'Not set'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member since</label>
                <span className="text-gray-900 dark:text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Theme Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Display Theme
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">☀️</div>
                      <div className="font-medium text-gray-900 dark:text-white">Light</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Always light</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌙</div>
                      <div className="font-medium text-gray-900 dark:text-white">Dark</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Always dark</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('auto')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'auto'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔄</div>
                      <div className="font-medium text-gray-900 dark:text-white">Auto</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Follow system</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
