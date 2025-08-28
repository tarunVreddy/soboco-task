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
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [gmailData, setGmailData] = useState<{
    messagesTotal: number;
    email: string;
    accountName: string;
    isConnected: boolean;
    integrationId?: string;
  } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsingTasks, setParsingTasks] = useState(false);
  const [resettingTracking, setResettingTracking] = useState(false);
  const [error, setError] = useState('');



  const fetchGmailData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gmail/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGmailData({
        messagesTotal: response.data.profile.messagesTotal,
        email: response.data.profile.emailAddress,
        accountName: response.data.integration?.account_name || 'Gmail',
        isConnected: true,
        integrationId: response.data.integration?.id
      });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Gmail integration not found')) {
        // Gmail not connected - this is expected
        setGmailData({
          messagesTotal: 0,
          email: '',
          accountName: '',
          isConnected: false
        });
      } else {
        console.error('Gmail API error:', error);
        setError('Failed to fetch Gmail data');
      }
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
    if (!gmailData?.integrationId) {
      setError('No Gmail integration found');
      return;
    }

    setParsingTasks(true);
    setError('');

    try {
      const response = await axios.post('/api/tasks/parse-gmail', 
        { integrationId: gmailData.integrationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh tasks and Gmail data after parsing
      await fetchTasks();
      await fetchGmailData();
      
      alert(`Parsing completed! Processed ${response.data.processed} messages, extracted ${response.data.extracted} tasks, created ${response.data.created} new tasks.`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to parse tasks');
    } finally {
      setParsingTasks(false);
    }
  };

  const handleResetTracking = async () => {
    if (!gmailData?.integrationId) {
      setError('No Gmail integration found');
      return;
    }

    if (!window.confirm('This will reset message tracking. The next time you parse for tasks, it will process all messages again. Continue?')) {
      return;
    }

    setResettingTracking(true);
    setError('');

    try {
      const response = await axios.post('/api/tasks/reset-tracking', 
        { integrationId: gmailData.integrationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(response.data.message);
      
      // Refresh Gmail data to update the message count
      await fetchGmailData();
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

  const getGmailUrl = (messageId: string) => {
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
                        Connected to <span className="font-medium text-gray-900">{gmailData.accountName}</span> ({gmailData.email})
                      </p>
                      <p className="text-3xl font-bold text-primary-600 mt-2">
                        {gmailData.messagesTotal.toLocaleString()} unparsed messages
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
                  {gmailData?.isConnected 
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
                          {task.source === 'gmail' && task.source_id && (
                            <a 
                              href={getGmailUrl(task.source_id)} 
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
