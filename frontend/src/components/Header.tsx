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
      ? 'bg-primary-100 text-primary-700 border-primary-500' 
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">Task Management Dashboard</h1>
            
            {/* Navigation Links */}
            <nav className="flex space-x-1">
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${getActiveClass('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/integrations" 
                className={`px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${getActiveClass('/integrations')}`}
              >
                Accounts
              </Link>
              <Link 
                to="/profile" 
                className={`px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${getActiveClass('/profile')}`}
              >
                Profile
              </Link>
            </nav>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
            <button 
              onClick={logout} 
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
