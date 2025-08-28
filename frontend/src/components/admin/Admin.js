import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import UserManagement from './UserManagement';
import SystemAnalytics from './SystemAnalytics';
import SystemLogs from './SystemLogs';
import {
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    
    loadSystemStats();
  }, [user]);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      setSystemStats(response.data.data);
    } catch (error) {
      console.error('Error loading system stats:', error);
      toast.error('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'users',
      name: 'User Management',
      icon: UsersIcon,
      description: 'Manage users, roles, and permissions'
    },
    {
      id: 'analytics',
      name: 'System Analytics',
      icon: ChartBarIcon,
      description: 'View system-wide analytics and metrics'
    },
    {
      id: 'logs',
      name: 'System Logs',
      icon: DocumentTextIcon,
      description: 'View system activity and audit logs'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-600">
                System administration and management console
              </p>
            </div>
            
            {systemStats && (
              <div className="flex space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {systemStats.overview.totalUsers}
                  </div>
                  <div className="text-gray-500">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {systemStats.overview.activeUsers}
                  </div>
                  <div className="text-gray-500">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {systemStats.overview.totalProjects}
                  </div>
                  <div className="text-gray-500">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {systemStats.overview.taskCompletionRate}%
                  </div>
                  <div className="text-gray-500">Task Completion</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="-mb-px flex space-x-8 bg-white rounded-lg p-1 shadow">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Tab Description */}
        <div className="mt-4 mb-6">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'users' && (
            <UserManagement systemStats={systemStats} onStatsUpdate={loadSystemStats} />
          )}
          
          {activeTab === 'analytics' && (
            <SystemAnalytics data={systemStats} />
          )}
          
          {activeTab === 'logs' && (
            <SystemLogs />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;