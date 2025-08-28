import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const [gmailData, setGmailData] = useState<{
    messagesTotal: number;
    email: string;
    isConnected: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const fetchGmailData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/gmail/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGmailData({
          messagesTotal: response.data.profile.messagesTotal,
          email: response.data.profile.emailAddress,
          isConnected: true
        });
      } catch (error: any) {
        if (error.response?.status === 400) {
          // Gmail not connected
          setGmailData({
            messagesTotal: 0,
            email: '',
            isConnected: false
          });
        } else {
          setError('Failed to fetch Gmail data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchGmailData();
    }
  }, [token]);

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

          {/* Gmail Inbox Status */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📧</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Gmail Inbox</h3>
                  {loading ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : error ? (
                    <p className="text-red-600">{error}</p>
                  ) : gmailData?.isConnected ? (
                    <div>
                      <p className="text-gray-600">
                        Connected to <span className="font-medium text-gray-900">{gmailData.email}</span>
                      </p>
                      <p className="text-3xl font-bold text-primary-600 mt-2">
                        {gmailData.messagesTotal.toLocaleString()} messages
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-3">No Gmail account connected</p>
                      <Link 
                        to="/integrations"
                        className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Connect Gmail
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              
              {gmailData?.isConnected && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Last updated</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
