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
    <div className="p-6">
      {/* Header and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">System Activity Logs</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="user_activity">User Activity</option>
            <option value="system">System Events</option>
            <option value="error">Errors</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-500">No system activity logs match your current filters.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getLogIcon(log.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLogTypeColor(log.type)}`}>
                        {log.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-900">
                        {formatLogMessage(log)}
                      </p>
                      
                      {log.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex flex-wrap gap-4">
                            {log.details.role && (
                              <span>Role: {log.details.role}</span>
                            )}
                            {log.details.isActive !== undefined && (
                              <span>Status: {log.details.isActive ? 'Active' : 'Inactive'}</span>
                            )}
                            {log.details.lastLogin && (
                              <span>Last Login: {new Date(log.details.lastLogin).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {log.user?.email && (
                        <div className="mt-1 text-xs text-gray-500">
                          {log.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-xs text-gray-400">
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
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.current} of {pagination.pages} ({pagination.total} entries)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Log Statistics */}
      {logs.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Log Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {logs.filter(log => log.type === 'user_activity').length}
              </div>
              <div className="text-sm text-gray-600">User Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {logs.filter(log => log.type === 'system').length}
              </div>
              <div className="text-sm text-gray-600">System Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {logs.filter(log => log.type === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Error Events</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;