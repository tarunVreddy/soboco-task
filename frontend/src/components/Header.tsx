import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getActiveClass = (path: string) => {
    return isActive(path) 
      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-gray-600' 
      : 'text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-gray-700/50';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-slate-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">SoBoCo</h1>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex bg-slate-100 dark:bg-gray-700/50 rounded-lg p-1 space-x-1">
              <Link 
                to="/dashboard" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${getActiveClass('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/integrations" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${getActiveClass('/integrations')}`}
              >
                Accounts
              </Link>
              <Link 
                to="/profile" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${getActiveClass('/profile')}`}
              >
                Profile
              </Link>
            </nav>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
