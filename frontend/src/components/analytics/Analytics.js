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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 py-4 sm:py-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Analytics & Insights
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Track progress and gain insights into your projects and team performance
              </p>
            </div>

            {/* View Toggle */}
            {!projectId && (
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => handleViewChange('dashboard')}
                  className={`flex items-center justify-center flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </button>
                <button
                  onClick={() => handleViewChange('team')}
                  className={`flex items-center justify-center flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeView === 'team'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
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