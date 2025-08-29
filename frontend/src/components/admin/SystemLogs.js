import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  DocumentTextIcon,
  UserCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [currentPage, typeFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        type: typeFilter
      };

      const response = await api.get('/admin/logs', { params });
      setLogs(response.data.data.logs);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
    toast.success('Logs refreshed');
  };

  const handleFilterChange = (type) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'user_activity':
        return <UserCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'user_activity':
        return 'bg-blue-100 text-blue-800';
      case 'system':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLogMessage = (log) => {
    switch (log.type) {
      case 'user_activity':
        if (log.action === 'login') {
          return `${log.user?.name || 'Unknown User'} logged in`;
        } else if (log.action === 'registered') {
          return `${log.user?.name || 'Unknown User'} registered`;
        }
        return `${log.user?.name || 'Unknown User'} performed ${log.action}`;
      default:
        return log.message || 'System activity';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-indigo-100/30 to-transparent rounded-full -translate-y-32 -translate-x-32 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-purple-100/30 to-transparent rounded-full translate-y-24 translate-x-24 blur-3xl"></div>
      
      {/* Header and Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 relative">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">System Activity Logs</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 text-gray-600 hover:text-indigo-600 hover:bg-white/70 disabled:opacity-50 transition-all duration-200"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex space-x-4">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-medium appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="user_activity">User Activity</option>
                <option value="system">System Events</option>
                <option value="error">Errors</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-100/20 to-transparent rounded-full translate-y-20 -translate-x-20"></div>
        
        <div className="divide-y divide-white/30 relative">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 inline-block mb-6">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-600">No system activity logs match your current filters.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="p-6 hover:bg-white/50 backdrop-blur-sm transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                    {getLogIcon(log.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full backdrop-blur-sm border border-white/30 ${getLogTypeColor(log.type)}`}>
                        {log.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-600 bg-white/50 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/30">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {formatLogMessage(log)}
                      </p>
                      
                      {log.details && (
                        <div className="mt-2 text-xs text-gray-600 bg-white/30 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                          <div className="flex flex-wrap gap-4">
                            {log.details.role && (
                              <span className="font-medium">Role: {log.details.role}</span>
                            )}
                            {log.details.isActive !== undefined && (
                              <span className="font-medium">Status: {log.details.isActive ? 'Active' : 'Inactive'}</span>
                            )}
                            {log.details.lastLogin && (
                              <span className="font-medium">Last Login: {new Date(log.details.lastLogin).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {log.user?.email && (
                        <div className="mt-1 text-xs text-gray-600 font-medium">
                          {log.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-xs text-gray-500 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-indigo-100/30 to-transparent rounded-full -translate-y-5 -translate-x-5"></div>
          
          <div className="flex items-center justify-between relative">
            <div className="text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
              Showing page {pagination.current} of {pagination.pages} ({pagination.total} entries)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 text-sm font-medium bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/70 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 text-sm font-medium bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/70 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Statistics */}
      {logs.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-100/20 to-transparent rounded-full translate-y-8 translate-x-8"></div>
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-100/20 to-transparent rounded-full -translate-y-6 -translate-x-6"></div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center relative">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <ClockIcon className="h-5 w-5 text-purple-600" />
            </div>
            Log Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-6">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {logs.filter(log => log.type === 'user_activity').length}
              </div>
              <div className="text-sm font-bold text-gray-700">User Activities</div>
            </div>
            <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-6">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {logs.filter(log => log.type === 'system').length}
              </div>
              <div className="text-sm font-bold text-gray-700">System Events</div>
            </div>
            <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-6">
              <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {logs.filter(log => log.type === 'error').length}
              </div>
              <div className="text-sm font-bold text-gray-700">Error Events</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;