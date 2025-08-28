import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Integration {
  id: string;
  provider: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Integrations: React.FC = () => {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    accessToken: '',
    refreshToken: ''
  });

  useEffect(() => {
    fetchIntegrations();
  }, [token]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrations(response.data.integrations);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.email || !formData.accessToken) {
      setError('Email and access token are required');
      return;
    }

    try {
      const response = await axios.post('/integrations/gmail', {
        email: formData.email,
        accessToken: formData.accessToken,
        refreshToken: formData.refreshToken || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(response.data.message);
      setFormData({ email: '', accessToken: '', refreshToken: '' });
      setShowAddForm(false);
      fetchIntegrations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to add Gmail account');
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      await axios.patch(`/integrations/${integrationId}/toggle`, {
        isActive: !isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchIntegrations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to toggle integration');
    }
  };

  const handleRemoveIntegration = async (integrationId: string) => {
    if (!window.confirm('Are you sure you want to remove this integration?')) {
      return;
    }

    try {
      await axios.delete(`/integrations/${integrationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Integration removed successfully');
      fetchIntegrations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to remove integration');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gmail':
        return '📧';
      case 'slack':
        return '💬';
      case 'microsoft':
        return '📊';
      default:
        return '🔗';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gmail':
        return 'Gmail';
      case 'slack':
        return 'Slack';
      case 'microsoft':
        return 'Microsoft 365';
      default:
        return provider;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Email Integrations</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Email Accounts</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect your email accounts to automatically extract tasks from your messages
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Add Integration Button */}
          <div className="flex justify-center">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Gmail Account'}
            </button>
          </div>

          {/* Add Integration Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Gmail Account</h3>
              <form onSubmit={handleAddGmail} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@gmail.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    id="accessToken"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    placeholder="Enter your Gmail access token"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You'll need to generate this token from Google Cloud Console
                  </p>
                </div>

                <div>
                  <label htmlFor="refreshToken" className="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Token (Optional)
                  </label>
                  <input
                    type="password"
                    id="refreshToken"
                    value={formData.refreshToken}
                    onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                    placeholder="Enter your Gmail refresh token"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div className="flex space-x-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Connect Gmail Account
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Integrations List */}
          <div className="space-y-6">
            {integrations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No email accounts connected yet</h3>
                <p className="text-gray-600">
                  Connect your Gmail account to start automatically extracting tasks from your emails.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getProviderIcon(integration.provider)}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{getProviderName(integration.provider)}</h4>
                          <p className="text-gray-600">{integration.email}</p>
                          <p className="text-sm text-gray-500">
                            Connected: {new Date(integration.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          integration.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleIntegration(integration.id, integration.is_active)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            integration.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {integration.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleRemoveIntegration(integration.id)}
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to get Gmail Access Token</h3>
            <ol className="space-y-2 text-gray-700 mb-4">
              <li className="flex items-start">
                <span className="text-blue-600 font-medium mr-2">1.</span>
                Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-medium mr-2">2.</span>
                Create a new project or select an existing one
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-medium mr-2">3.</span>
                Enable the Gmail API
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-medium mr-2">4.</span>
                Create OAuth 2.0 credentials
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-medium mr-2">5.</span>
                Generate an access token using the OAuth 2.0 playground
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-medium mr-2">6.</span>
                Copy the access token and paste it above
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Integrations;
