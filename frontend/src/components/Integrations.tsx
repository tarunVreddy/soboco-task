import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import axios from 'axios';

interface Integration {
  id: string;
  provider: string;
  account_name: string;
  account_email: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

const Integrations: React.FC = () => {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, [token]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrations(response.data.integrations);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await axios.get('/api/integrations/add-account-url?provider=google', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open the OAuth URL in a new window
      window.open(response.data.authUrl, '_blank', 'width=600,height=700');
      
      // Refresh integrations after a short delay to catch the new account
      setTimeout(() => {
        fetchIntegrations();
      }, 2000);
    } catch (error: any) {
      console.error('Add account error:', error);
      setError(error.response?.data?.error || 'Failed to get add account URL');
    }
  };

  const handleRemoveIntegration = async (integrationId: string) => {
    if (!window.confirm('Are you sure you want to remove this account? This will delete all associated data.')) {
      return;
    }

    try {
      await axios.delete(`/api/integrations/${integrationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh integrations
      await fetchIntegrations();
      
      alert('Account removed successfully!');
    } catch (error: any) {
      console.error('Remove integration error:', error);
      setError(error.response?.data?.error || 'Failed to remove account');
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      await axios.patch(`/api/integrations/${integrationId}/toggle`, 
        { is_active: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh integrations
      await fetchIntegrations();
    } catch (error: any) {
      console.error('Toggle integration error:', error);
      setError(error.response?.data?.error || 'Failed to toggle account');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '📧';
      case 'microsoft':
        return '📧';
      case 'slack':
        return '💬';
      default:
        return '🔗';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Gmail';
      case 'microsoft':
        return 'Outlook';
      case 'slack':
        return 'Slack';
      default:
        return provider;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">🔑</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Account Keychain</h2>
                  <p className="text-lg text-gray-600">
                    Manage your connected accounts and add new ones to your keychain
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddAccount}
                className="bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Account</span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Accounts List */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your accounts...</p>
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No accounts connected</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Connect your first account to start managing tasks from multiple sources. 
                  You can add Gmail, Outlook, Slack, and more.
                </p>
                <button
                  onClick={handleAddAccount}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Connect Your First Account
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Connected Accounts ({integrations.length})
                  </h3>
                  <div className="text-sm text-gray-500">
                    {integrations.filter(i => i.is_active).length} active
                  </div>
                </div>

                <div className="grid gap-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">
                            {getProviderIcon(integration.provider)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-gray-900">{integration.account_name}</h4>
                              <span className="text-sm text-gray-500">
                                ({getProviderName(integration.provider)})
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{integration.account_email}</p>
                            {integration.metadata?.messagesTotal && (
                              <p className="text-xs text-gray-500 mt-1">
                                {integration.metadata.messagesTotal.toLocaleString()} total messages
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Connected {new Date(integration.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleToggleIntegration(integration.id, integration.is_active)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                              integration.is_active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {integration.is_active ? 'Active' : 'Inactive'}
                          </button>
                          
                          <button
                            onClick={() => handleRemoveIntegration(integration.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      {integration.metadata?.error && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-yellow-800">
                              Connection issue: {integration.metadata.error}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add More Accounts */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="text-2xl mb-2">➕</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Add Another Account</h4>
                  <p className="text-gray-600 mb-4">
                    Connect more accounts to manage tasks from multiple sources
                  </p>
                  <button
                    onClick={handleAddAccount}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    + Add Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-blue-900">How it works</h4>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• Connect multiple Gmail accounts to your keychain</li>
                  <li>• Each account's messages will be scanned for tasks</li>
                  <li>• Toggle accounts on/off without removing them</li>
                  <li>• All connected accounts are managed from one place</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Integrations;
