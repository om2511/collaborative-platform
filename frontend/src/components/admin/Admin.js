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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-r from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative bg-white/70 backdrop-blur-xl shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 py-4 sm:py-6">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                Admin Panel
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                System administration and management console
              </p>
            </div>
            
            {systemStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full sm:w-auto">
                <div className="text-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg hover:bg-white/70 transition-all duration-200">
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                    {systemStats.overview.totalUsers}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Users</div>
                </div>
                <div className="text-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg hover:bg-white/70 transition-all duration-200">
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                    {systemStats.overview.activeUsers}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Users</div>
                </div>
                <div className="text-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg hover:bg-white/70 transition-all duration-200">
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent">
                    {systemStats.overview.totalProjects}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Projects</div>
                </div>
                <div className="text-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg hover:bg-white/70 transition-all duration-200">
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                    {systemStats.overview.taskCompletionRate}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Task Completion</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        <nav className="flex flex-wrap gap-2 sm:gap-4 bg-white/70 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex-1 sm:flex-none justify-center sm:justify-start border ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg border-transparent'
                    : 'text-gray-700 hover:text-gray-900 bg-white/50 hover:bg-white/70 border-white/30 backdrop-blur-sm'
                }`}
              >
                <Icon className="h-5 w-5 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden text-xs">{tab.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Description */}
        <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
          <p className="text-sm text-gray-700 font-medium">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full translate-y-6 -translate-x-6"></div>
          
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