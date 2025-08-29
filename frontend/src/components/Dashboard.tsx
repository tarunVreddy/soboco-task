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
  email_received_at?: string; // When the email was received
  email_sender?: string; // Who sent the email
  email_recipients?: string; // Who received the email (to/cc)
}

interface EmailContent {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  recipients: string;
  snippet: string;
  date: Date;
  content: string;
  headers: Record<string, string>;
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
  const [parsingProgress, setParsingProgress] = useState({ 
    current: 0, 
    total: 0, 
    message: '',
    extracted: 0,
    created: 0,
    recentTasks: [] as string[]
  });
  const [resettingTracking, setResettingTracking] = useState(false);
  const [error, setError] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('all'); // 'all' or account email
  const [showAllPriorities, setShowAllPriorities] = useState(false); // false = only High/Urgent, true = all priorities
  const [statusFilter, setStatusFilter] = useState<Record<Task['status'], boolean>>({
    PENDING: true,
    IN_PROGRESS: true,
    COMPLETED: false,
    CANCELLED: false
  });
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [emailPreview, setEmailPreview] = useState<EmailContent | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

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

  // Close status filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showStatusFilter && !target.closest('.sidebar-status-filter')) {
        setShowStatusFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusFilter]);

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

  const fetchEmailContent = async (messageId: string, integrationId?: string) => {
    try {
      const params = integrationId ? { integrationId } : {};
      const response = await axios.get(`/api/gmail/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch email content:', error);
      return null;
    }
  };

  const handleEmailPreview = async (event: React.MouseEvent, task: Task) => {
    if (!task.source_id) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewPosition({ x: rect.left, y: rect.bottom + 10 });
    
    const emailContent = await fetchEmailContent(task.source_id, task.integration_id);
    if (emailContent) {
      setEmailPreview(emailContent);
    }
  };

  const handleEmailPreviewLeave = () => {
    setEmailPreview(null);
  };

  const handleParseTasks = async () => {
    if (!gmailData?.accounts || gmailData.accounts.length === 0) {
      setError('No Gmail accounts found');
      return;
    }

    setParsingTasks(true);
    setParsingProgress({ current: 0, total: 0, message: 'Starting parsing...', extracted: 0, created: 0, recentTasks: [] });
    setError('');

    try {
      const allAccounts = gmailData.accounts;
      const accountsWithUnparsedMessages = allAccounts.filter(account => account.counts.unparsedMessages > 0);
      
      console.log(`🔍 [DEBUG] Found ${gmailData.accounts.length} total accounts`);
      console.log(`🔍 [DEBUG] Accounts with unparsed messages: ${accountsWithUnparsedMessages.length}`);
      console.log(`🔍 [DEBUG] Account details:`, allAccounts.map(acc => ({
        email: acc.accountEmail,
        id: acc.integrationId,
        isActive: acc.isActive,
        unparsed: acc.counts.unparsedMessages
      })));
      
      if (accountsWithUnparsedMessages.length === 0) {
        setParsingProgress(prev => ({ ...prev, message: 'No unparsed messages found in any account' }));
        setTimeout(() => setParsingProgress({ current: 0, total: 0, message: '', extracted: 0, created: 0, recentTasks: [] }), 2000);
        return;
      }
      
              for (let i = 0; i < accountsWithUnparsedMessages.length; i++) {
          const account = accountsWithUnparsedMessages[i];
        
        try {
          setParsingProgress(prev => ({ 
            ...prev,
            current: i + 1, 
            total: allAccounts.length, 
            message: `Parsing ${account.accountEmail}...` 
          }));
          
          console.log(`🔍 [DEBUG] Parsing tasks for account: ${account.accountEmail} (${account.integrationId})`);
          
          // Use fetch with streaming for real-time updates
          const response = await fetch('/api/tasks/parse-gmail', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ integrationId: account.integrationId })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            throw new Error('No response body reader available');
          }
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log('🔍 [DEBUG] SSE Event:', data);
                  
                  switch (data.type) {
                    case 'start':
                      setParsingProgress(prev => ({ ...prev, message: data.message }));
                      break;
                    case 'progress':
                      setParsingProgress(prev => ({ 
                        ...prev, 
                        message: data.message,
                        current: data.current,
                        total: data.total
                      }));
                      break;
                    case 'message':
                      setParsingProgress(prev => ({ 
                        ...prev, 
                        message: data.message,
                        current: data.current,
                        total: data.total
                      }));
                      break;
                    case 'extracted':
                      setParsingProgress(prev => ({ 
                        ...prev, 
                        message: data.message,
                        extracted: prev.extracted + data.extracted
                      }));
                      break;
                    case 'task_created':
                      setParsingProgress(prev => ({ 
                        ...prev, 
                        message: data.message,
                        created: data.createdCount,
                        recentTasks: [...prev.recentTasks.slice(-4), data.taskTitle] // Keep last 5 tasks
                      }));
                      // Refresh tasks and counts in real-time
                      fetchTasks();
                      fetchGmailData();
                      break;
                    case 'complete':
                      setParsingProgress(prev => ({ 
                        ...prev, 
                        message: data.message,
                        current: prev.total,
                        extracted: data.extracted,
                        created: data.created
                      }));
                      break;
                    case 'error':
                      setError(data.error);
                      break;
                  }
                } catch (error) {
                  console.error('Error parsing SSE data:', error);
                }
              }
            }
          }
          
        } catch (error: any) {
          console.error(`❌ [DEBUG] Error parsing tasks for account ${account.accountEmail}:`, error);
          setParsingProgress(prev => ({ 
            ...prev,
            message: `Error parsing ${account.accountEmail}`
          }));
        }
      }
      
      setParsingProgress(prev => ({ ...prev, message: 'Parsing completed!' }));
      setTimeout(() => setParsingProgress({ current: 0, total: 0, message: '', extracted: 0, created: 0, recentTasks: [] }), 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to parse tasks');
      setParsingProgress({ current: 0, total: 0, message: 'Parsing failed', extracted: 0, created: 0, recentTasks: [] });
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
      
      await fetchGmailData();
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
      
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks(new Set());
      setSelectAll(false);
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
      setSelectAll(true);
    }
  };

  const handleMassAction = async (action: 'delete' | 'complete' | 'cancel') => {
    if (selectedTasks.size === 0) return;

    const actionText = {
      delete: 'delete',
      complete: 'mark as completed',
      cancel: 'mark as cancelled'
    }[action];

    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedTasks.size} selected task${selectedTasks.size !== 1 ? 's' : ''}?`)) return;

    try {
      const promises = Array.from(selectedTasks).map(taskId => {
        if (action === 'delete') {
          return axios.delete(`/api/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          const status = action === 'complete' ? 'COMPLETED' : 'CANCELLED';
          return axios.patch(`/api/tasks/${taskId}/status`, 
            { status },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      });

      await Promise.all(promises);
      
      if (action === 'delete') {
        setTasks(tasks.filter(task => !selectedTasks.has(task.id)));
      } else {
        const status = action === 'complete' ? 'COMPLETED' : 'CANCELLED';
        setTasks(tasks.map(task => 
          selectedTasks.has(task.id) ? { ...task, status } : task
        ));
      }
      
      setSelectedTasks(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error(`Failed to ${action} tasks:`, error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };



  const getGmailUrl = (messageId: string, accountEmail?: string) => {
    if (accountEmail) {
      // Use authuser parameter to specify the account
      return `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(accountEmail)}#inbox/${messageId}`;
    }
    // Fallback to default Gmail URL if no account email is provided
    return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
  };

  // Filter tasks based on selected account, priority, and sender
  const filteredTasks = tasks
    .filter(task => selectedAccount === 'all' || task.account_email === selectedAccount)
    .filter(task => {
      // Exclude tasks where the user is the sender (they're unlikely to create tasks for themselves)
      if (task.email_sender && task.account_email && 
          task.email_sender.toLowerCase() === task.account_email.toLowerCase()) {
        return false;
      }
      return true;
    })
    .filter(task => {
      if (showAllPriorities) {
        return true; // Show all priorities
      }
      // Only show High and Urgent tasks by default
      return task.priority === 'HIGH' || task.priority === 'URGENT';
    })
    .filter(task => statusFilter[task.status]); // Apply status filter

  // Get unique accounts from tasks
  const taskAccounts = Array.from(new Set(tasks.map(task => task.account_email).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <Header />

      {/* Main Layout */}
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Task Manager</h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Organize your productivity</p>
          </div>

          {/* Account Filters */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Filter by Account</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedAccount('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedAccount === 'all'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Tasks</span>
                    <span className="bg-slate-100 dark:bg-gray-600 text-slate-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {tasks.length}
                    </span>
                  </div>
                </button>
                
                {taskAccounts.map((accountEmail) => {
                  const accountTasks = tasks.filter(task => task.account_email === accountEmail);
                  return (
                    <button
                      key={accountEmail}
                      onClick={() => setSelectedAccount(accountEmail!)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedAccount === accountEmail
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                          : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="truncate">{accountEmail}</span>
                        </div>
                        <span className="bg-slate-100 dark:bg-gray-600 text-slate-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                          {accountTasks.length}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Priority Filter</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAllPriorities(false)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !showAllPriorities
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>🔥 High & Urgent Only</span>
                    </div>
                    <span className="bg-slate-100 dark:bg-gray-600 text-slate-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {tasks.filter(task => task.priority === 'HIGH' || task.priority === 'URGENT').length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setShowAllPriorities(true)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showAllPriorities
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>📋 All Priorities</span>
                    </div>
                    <span className="bg-slate-100 dark:bg-gray-600 text-slate-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {tasks.length}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Task Status */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Task Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">⏳</span>
                    <span className="text-sm text-slate-700 dark:text-gray-300">Pending</span>
                  </div>
                  <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium">
                    {tasks.filter(task => task.status === 'PENDING').length}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">⚙️</span>
                    <span className="text-sm text-slate-700 dark:text-gray-300">In Progress</span>
                  </div>
                  <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                    {tasks.filter(task => task.status === 'IN_PROGRESS').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Unparsed Messages by Account */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Ready to Parse</h3>
              <div className="space-y-2">
                {gmailData?.accounts && gmailData.accounts.length > 0 ? (
                  gmailData.accounts.map((account) => (
                    <div key={account.integrationId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-gray-700">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-sm">📧</span>
                        <span className="text-sm text-slate-700 dark:text-gray-300 truncate">
                          {account.accountEmail}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.counts.unparsedMessages > 0 
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {account.counts.unparsedMessages}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📧</span>
                      <span className="text-sm text-slate-700 dark:text-gray-300">No accounts</span>
                    </div>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-xs font-medium">
                      0
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-6 sidebar-status-filter">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Status Filter</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>⚙️ Filter by Status</span>
                    </div>
                    <span className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-full text-xs">
                      {Object.values(statusFilter).filter(Boolean).length}
                    </span>
                  </div>
                </button>
                
                {showStatusFilter && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-gray-600 p-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Show Tasks:</span>
                      <button
                        onClick={() => setShowStatusFilter(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilter.PENDING}
                          onChange={(e) => setStatusFilter({ ...statusFilter, PENDING: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">⏳</span>
                          <span className="text-xs text-slate-700 dark:text-gray-300">Pending</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilter.IN_PROGRESS}
                          onChange={(e) => setStatusFilter({ ...statusFilter, IN_PROGRESS: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">⚙️</span>
                          <span className="text-xs text-slate-700 dark:text-gray-300">In Progress</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilter.COMPLETED}
                          onChange={(e) => setStatusFilter({ ...statusFilter, COMPLETED: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">✅</span>
                          <span className="text-xs text-slate-700 dark:text-gray-300">Completed</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilter.CANCELLED}
                          onChange={(e) => setStatusFilter({ ...statusFilter, CANCELLED: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">❌</span>
                          <span className="text-xs text-slate-700 dark:text-gray-300">Cancelled</span>
                        </div>
                      </label>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-gray-600">
                      <button
                        onClick={() => setStatusFilter({ PENDING: true, IN_PROGRESS: true, COMPLETED: false, CANCELLED: false })}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Quick Actions */}
            <div className="border-t border-slate-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleParseTasks}
                  disabled={parsingTasks}
                  className={`w-full text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                    parsingTasks 
                      ? parsingProgress.total > 0 && parsingProgress.current > 0
                        ? `bg-gradient-to-r from-indigo-800 to-indigo-600`
                        : 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  style={{
                    background: parsingTasks && parsingProgress.total > 0 && parsingProgress.current > 0
                      ? `linear-gradient(to right, #3730a3 ${(parsingProgress.current / parsingProgress.total) * 100}%, #4f46e5 ${(parsingProgress.current / parsingProgress.total) * 100}%)`
                      : undefined
                  }}
                >
                  {parsingTasks ? (
                    <div className="flex items-center justify-between relative z-10">
                      <span>Parsing...</span>
                      {parsingProgress.total > 0 && (
                        <span className="text-xs bg-indigo-700/50 backdrop-blur-sm px-2 py-1 rounded">
                          {parsingProgress.current}/{parsingProgress.total}
                        </span>
                      )}
                    </div>
                  ) : (
                    'Parse New Tasks'
                  )}
                </button>

                <button
                  onClick={handleResetTracking}
                  disabled={resettingTracking}
                  className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingTracking ? 'Resetting...' : 'Reset All Tasks'}
                </button>
                <Link
                  to="/integrations"
                  className="w-full bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors block text-center"
                >
                  Manage Accounts
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar with Gmail Summary */}
          <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedAccount === 'all' ? 'All Tasks' : `Tasks from ${selectedAccount}`}
                </h1>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} • 
                  {filteredTasks.filter(t => t.status === 'COMPLETED').length} completed
                </p>
              </div>



              {/* Gmail Summary Box */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📧</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Gmail Status</h3>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-xs text-slate-600 dark:text-gray-400">Loading...</div>
                ) : error ? (
                  <div className="text-xs text-red-600">{error}</div>
                ) : gmailData?.accounts && gmailData.accounts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-gray-400">Total:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{gmailData.totals.totalMessages.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-gray-400">Parsed:</span>
                      <span className="font-medium text-emerald-600">{gmailData.totals.parsedMessages.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-gray-400">Unparsed:</span>
                      <span className="font-medium text-blue-600">{gmailData.totals.unparsedMessages.toLocaleString()}</span>
                    </div>
                    <div className="pt-1 border-t border-blue-200 dark:border-blue-700">
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        {gmailData.totals.activeAccounts} active account{gmailData.totals.activeAccounts !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    No accounts connected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-auto p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {selectedAccount === 'all' ? 'No tasks yet' : 'No tasks for this account'}
                </h3>
                <p className="text-slate-600 dark:text-gray-400 max-w-sm mx-auto">
                  {gmailData?.accounts && gmailData.accounts.length > 0
                    ? 'Click "Parse New Tasks" in the sidebar to extract tasks from your Gmail inbox'
                    : 'Connect your Gmail account to start extracting tasks'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mass Actions Bar */}
                {selectedTasks.size > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMassAction('complete')}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleMassAction('cancel')}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Mark Cancelled
                        </button>
                        <button
                          onClick={() => handleMassAction('delete')}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-3 mb-1.5">
                          <div className="flex items-center pt-1">
                            <input
                              type="checkbox"
                              checked={selectedTasks.has(task.id)}
                              onChange={() => handleSelectTask(task.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{task.title}</h4>
                            {task.description && (
                              <p className="text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm text-slate-500 dark:text-gray-400">
                          {task.account_email && (
                            <div className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{task.account_email}</span>
                            </div>
                          )}
                          {task.source === 'gmail' && task.source_id && (
                            <div className="relative">
                              <a 
                                href={getGmailUrl(task.source_id, task.account_email)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onMouseEnter={(e) => handleEmailPreview(e, task)}
                                onMouseLeave={handleEmailPreviewLeave}
                                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
                                title="View Email"
                              >
                                <span className="text-lg">📧</span>
                              </a>
                              
                              {/* Email Preview Tooltip */}
                              {emailPreview && emailPreview.id === task.source_id && (
                                <div 
                                  className="absolute z-50 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md"
                                  style={{
                                    left: `${previewPosition.x}px`,
                                    top: `${previewPosition.y}px`,
                                    transform: 'translateX(-50%)'
                                  }}
                                >
                                  <div className="mb-2">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                      {emailPreview.subject}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-gray-400">
                                      From: {emailPreview.sender}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-gray-400">
                                      {new Date(emailPreview.date).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                                    {emailPreview.content.length > 200 
                                      ? `${emailPreview.content.substring(0, 200)}...`
                                      : emailPreview.content
                                    }
                                  </div>
                                  <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                                    Click to open full email
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span>📧</span>
                            <span>Received {task.email_received_at ? new Date(task.email_received_at).toLocaleDateString() : new Date(task.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="flex items-center space-x-0.5">
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'PENDING')}
                            className={`p-1.5 rounded-full transition-colors ${
                              task.status === 'PENDING' 
                                ? 'bg-slate-100 text-slate-800' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                            title="Mark as Pending"
                          >
                            ⏳
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                            className={`p-1.5 rounded-full transition-colors ${
                              task.status === 'IN_PROGRESS' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Mark as In Progress"
                          >
                            ⚙️
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                            className={`p-1.5 rounded-full transition-colors ${
                              task.status === 'COMPLETED' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title="Mark as Completed"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'CANCELLED')}
                            className={`p-1.5 rounded-full transition-colors ${
                              task.status === 'CANCELLED' 
                                ? 'bg-red-100 text-red-800' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Mark as Cancelled"
                          >
                            ❌
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
