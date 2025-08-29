import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ProjectAnalytics from './ProjectAnalytics';
import DashboardAnalytics from './DashboardAnalytics';
import TeamAnalytics from './TeamAnalytics';
import InsightsPanel from './InsightsPanel';
import {
  ChartBarIcon,
  UserGroupIcon,
  LightBulbIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const { id: projectId } = useParams();
  const [activeView, setActiveView] = useState('dashboard');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      setActiveView('project');
    }
    loadAnalyticsData();
  }, [projectId, activeView]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      let response;

      switch (activeView) {
        case 'project':
          if (!projectId) return;
          response = await api.get(`/analytics/projects/${projectId}`);
          break;
        case 'team':
          response = await api.get('/analytics/team/current');
          break;
        case 'dashboard':
        default:
          response = await api.get('/analytics/dashboard');
          break;
      }

      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setAnalyticsData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
        
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <ChartBarIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading analytics data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                Analytics & Insights
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Track progress and gain insights into your projects and team performance
              </p>
            </div>

            {/* View Toggle */}
            {!projectId && (
              <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 w-full sm:w-auto border border-white/30 shadow-lg">
                <button
                  onClick={() => handleViewChange('dashboard')}
                  className={`flex items-center justify-center flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeView === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </button>
                <button
                  onClick={() => handleViewChange('team')}
                  className={`flex items-center justify-center flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeView === 'team'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <UserGroupIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Team Analytics</span>
                  <span className="sm:hidden">Team</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeView === 'project' && projectId && (
          <ProjectAnalytics data={analyticsData} projectId={projectId} />
        )}

        {activeView === 'team' && (
          <TeamAnalytics data={analyticsData} />
        )}

        {activeView === 'dashboard' && (
          <DashboardAnalytics data={analyticsData} />
        )}

        {/* AI Insights Panel */}
        {analyticsData?.insights && (
          <div className="mt-6 sm:mt-8">
            <InsightsPanel insights={analyticsData.insights} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;