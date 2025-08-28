import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  due_date?: string;
  source: string;
  source_id?: string;
  integration_id?: string;
  account_email?: string;
  account_name?: string;
  created_at: string;
}

interface GmailAccountCounts {
  integrationId: string;
  accountName: string;
  accountEmail: string;
  isActive: boolean;
  error?: string;
  counts: {
    totalMessages: number;
    parsedMessages: number;
    unparsedMessages: number;
  };
}

interface GmailMessageCounts {
  accounts: GmailAccountCounts[];
  totals: {
    totalMessages: number;
    parsedMessages: number;
    unparsedMessages: number;
    activeAccounts: number;
  };
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [gmailData, setGmailData] = useState<GmailMessageCounts | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsingTasks, setParsingTasks] = useState(false);
  const [resettingTracking, setResettingTracking] = useState(false);
  const [error, setError] = useState('');




  const fetchGmailData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gmail/message-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGmailData(response.data);
    } catch (error: any) {
      console.error('Gmail API error:', error);
      setError('Failed to fetch Gmail data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGmailData();
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };



  const handleParseTasks = async () => {
    if (!gmailData?.accounts || gmailData.accounts.length === 0) {
      setError('No Gmail accounts found');
      return;
    }

    setParsingTasks(true);
    setError('');

    try {
      // Parse tasks for ALL accounts (not just active ones)
      const allAccounts = gmailData.accounts;
      
      console.log(`🔍 [DEBUG] Found ${gmailData.accounts.length} total accounts`);
      console.log(`🔍 [DEBUG] Full account data:`, JSON.stringify(gmailData.accounts, null, 2));
      
      allAccounts.forEach(account => {
        console.log(`🔍 [DEBUG] Account: ${account.accountEmail} (${account.integrationId}) - Active: ${account.isActive}`);
      });
      
      for (const account of allAccounts) {
        try {
          console.log(`🔍 [DEBUG] Parsing tasks for account: ${account.accountEmail} (${account.integrationId})`);
          const response = await axios.post('/api/tasks/parse-gmail', 
            { integrationId: account.integrationId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log(`✅ [DEBUG] Successfully parsed tasks for account: ${account.accountEmail}`, response.data);
          
          // Add delay between accounts to avoid rate limiting
          if (allAccounts.indexOf(account) < allAccounts.length - 1) {
            console.log(`⏳ [DEBUG] Waiting 2 seconds before processing next account...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error: any) {
          console.error(`❌ [DEBUG] Error parsing tasks for account ${account.accountEmail}:`, error);
          
          // If we get a 429 error, wait longer before continuing
          if (error.response?.status === 429) {
            console.log(`⏳ [DEBUG] Rate limited! Waiting 10 seconds before continuing...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      }
      
      // Refresh tasks and Gmail data after parsing
      await fetchTasks();
      await fetchGmailData();
      
      alert('Parsing completed for all accounts!');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to parse tasks');
    } finally {
      setParsingTasks(false);
    }
  };

  const handleResetTracking = async () => {
    if (!gmailData?.accounts || gmailData.accounts.length === 0) {
      setError('No Gmail accounts found');
      return;
    }

    if (!window.confirm('This will delete ALL existing tasks and reset message tracking for ALL accounts in your keychain. The next time you parse for tasks, it will process all messages from all accounts again. This action cannot be undone. Continue?')) {
      return;
    }

    setResettingTracking(true);
    setError('');

    try {
      // Reset tracking for all accounts
      const activeAccounts = gmailData.accounts.filter(account => account.isActive);
      
      for (const account of activeAccounts) {
        try {
          await axios.post('/api/tasks/reset-tracking', 
            { integrationId: account.integrationId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error(`Error resetting tracking for account ${account.accountEmail}:`, error);
        }
      }
      
      alert('All tasks deleted and message tracking reset successfully for all accounts in your keychain!');
      
      // Refresh Gmail data to update the message count
      await fetchGmailData();
      // Refresh tasks to reflect the deletion
      await fetchTasks();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reset message tracking');
    } finally {
      setResettingTracking(false);
    }
  };



  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGmailUrl = (messageId: string, accountEmail?: string) => {
    // For now, we'll use the default Gmail URL since we can't force a specific account
    // Gmail will redirect to the appropriate account based on the user's session
    return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📧</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Gmail Inbox</h3>
                  {loading ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : error ? (
                    <p className="text-red-600">{error}</p>
                  ) : gmailData?.accounts && gmailData.accounts.length > 0 ? (
                    <div>
                      <p className="text-gray-600">
                        {gmailData.totals.activeAccounts} active account{gmailData.totals.activeAccounts !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center space-x-6 mt-2">
                        <div>
                          <p className="text-sm text-gray-500">Total Messages</p>
                          <p className="text-2xl font-bold text-gray-900">{gmailData.totals.totalMessages.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Parsed</p>
                          <p className="text-2xl font-bold text-green-600">{gmailData.totals.parsedMessages.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Unparsed</p>
                          <p className="text-2xl font-bold text-blue-600">{gmailData.totals.unparsedMessages.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-3">No Gmail accounts connected</p>
                      <Link 
                        to="/integrations"
                        className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Manage Accounts
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              
              {gmailData?.accounts && gmailData.accounts.length > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Last updated</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={handleParseTasks}
                      disabled={parsingTasks}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {parsingTasks ? 'Parsing...' : 'Parse for Tasks'}
                    </button>
                    <button
                      onClick={handleResetTracking}
                      disabled={resettingTracking}
                      className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resettingTracking ? 'Resetting...' : 'Reset Message Tracking'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Details */}
            {gmailData?.accounts && gmailData.accounts.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h4>
                <div className="grid gap-4">
                  {gmailData.accounts.map((account) => (
                    <div key={account.integrationId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <h5 className="font-medium text-gray-900">{account.accountName}</h5>
                            <p className="text-sm text-gray-600">{account.accountEmail}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {account.error ? (
                            <div className="text-red-600 text-sm">{account.error}</div>
                          ) : (
                            <div className="flex items-center space-x-4 text-sm">
                              <div>
                                <span className="text-gray-500">Total:</span>
                                <span className="font-medium ml-1">{account.counts.totalMessages.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Parsed:</span>
                                <span className="font-medium text-green-600 ml-1">{account.counts.parsedMessages.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Unparsed:</span>
                                <span className="font-medium text-blue-600 ml-1">{account.counts.unparsedMessages.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📋</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Your Tasks</h3>
                  <p className="text-gray-600">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
                  </p>
                </div>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
                <p className="text-gray-600">
                  {gmailData?.accounts && gmailData.accounts.length > 0
                    ? 'Click "Parse for Tasks" above to extract tasks from your Gmail inbox'
                    : 'Connect your Gmail account to start extracting tasks'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Source: {task.source}</span>
                          {task.account_email && (
                            <span className="text-blue-600 font-medium">📧 {task.account_email}</span>
                          )}
                          {task.source === 'gmail' && task.source_id && (
                            <a 
                              href={getGmailUrl(task.source_id, task.account_email)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              View Email
                            </a>
                          )}
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
