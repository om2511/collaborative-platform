import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { projectService, taskService, activityService } from '../../services/api';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import {
  PlusIcon,
  FolderIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowPathIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    teamMembers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load all projects for accurate statistics
      const projectResponse = await projectService.getProjects();
      
      const projectsData = projectResponse.data.data?.projects || projectResponse.data.projects || projectResponse.data.data || projectResponse.data || [];
      const validProjectsData = Array.isArray(projectsData) ? projectsData : [];
      
      // Display only the 5 most recent projects in the UI, but use all for stats
      const recentProjectsForDisplay = validProjectsData.slice(0, 5);
      setProjects(recentProjectsForDisplay);

      // Calculate stats from real data
      const totalProjects = validProjectsData.length;
      const activeProjects = validProjectsData.filter(p => p.status === 'active').length;
      
      // Get all tasks for user's projects to calculate task stats
      let completedTasks = 0;
      let totalTasks = 0;
      
      try {
        // Get task counts from each project
        const taskPromises = validProjectsData.map(async (project) => {
          try {
            const taskResponse = await taskService.getProjectTasks(project._id);
            const tasks = taskResponse.data.tasks || taskResponse.data.data || [];
            return {
              total: tasks.length,
              completed: tasks.filter(t => t.status === 'done').length
            };
          } catch (err) {
            return { total: 0, completed: 0 };
          }
        });
        
        const taskStats = await Promise.all(taskPromises);
        totalTasks = taskStats.reduce((sum, stat) => sum + stat.total, 0);
        completedTasks = taskStats.reduce((sum, stat) => sum + stat.completed, 0);
      } catch (taskError) {
        console.warn('Could not load task statistics');
      }
      
      setStats({
        totalProjects,
        activeProjects,
        completedTasks,
        totalTasks,
        teamMembers: new Set(validProjectsData.flatMap(p => p.team?.map(t => t.user?._id || t.user) || [])).size
      });
      

      // Load real dashboard activity data
      try {
        // Use dashboard analytics endpoint for activity data
        const dashboardResponse = await api.get('/analytics/dashboard');
        const dashboardData = dashboardResponse.data.data;
        
        const dashboardActivity = [];
        
        // Add recent tasks as activities
        if (dashboardData.recentTasks && Array.isArray(dashboardData.recentTasks)) {
          dashboardData.recentTasks.slice(0, 3).forEach((task, index) => {
            dashboardActivity.push({
              id: `task_${task._id || index + 1}`,
              type: task.status === 'done' ? 'task_completed' : 'task_updated',
              message: `Task "${task.title}" was ${task.status === 'done' ? 'completed' : 'updated'}`,
              time: task.updatedAt ? formatTimeAgo(task.updatedAt) : 'Recently',
              user: task.assignee?.name || user.name
            });
          });
        }
        
        // Add recent project activities
        if (dashboardData.recentProjects && Array.isArray(dashboardData.recentProjects)) {
          dashboardData.recentProjects.slice(0, 2).forEach((project, index) => {
            dashboardActivity.push({
              id: `project_${project._id || index + 1}`,
              type: 'project_updated',
              message: `Project "${project.name}" was updated`,
              time: project.updatedAt ? formatTimeAgo(project.updatedAt) : 'Recently',
              user: project.owner?.name || user.name
            });
          });
        }
        
        setRecentActivity(dashboardActivity);
      } catch (analyticsError) {
        console.warn('Could not load dashboard analytics, falling back to projects');
        
        // Fallback: create activity from projects data
        const fallbackActivity = validProjectsData.length > 0
          ? validProjectsData.slice(0, 3).map((project, index) => ({
              id: index + 1,
              type: 'project_active',
              message: `Working on project "${project.title}"`,
              time: project.updatedAt ? formatTimeAgo(project.updatedAt) : 'Recently',
              user: project.owner?.name || user.name
            }))
          : [
              {
                id: 1,
                type: 'welcome',
                message: 'Welcome to the dashboard! Create your first project to get started.',
                time: 'Just now',
                user: user.name
              }
            ];
        
        setRecentActivity(fallbackActivity);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Ensure we always have arrays set even on error
      setProjects([]);
      setRecentActivity([]);
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedTasks: 0,
        totalTasks: 0,
        teamMembers: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [user.name]);

  // Helper function to format relative time
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Also refresh when the component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    const handleFocus = () => {
      loadDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadDashboardData]);

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50',
      active: 'bg-green-100/80 text-green-700 border-green-200/50',
      on_hold: 'bg-gray-100/80 text-gray-700 border-gray-200/50',
      completed: 'bg-blue-100/80 text-blue-700 border-blue-200/50',
      cancelled: 'bg-red-100/80 text-red-700 border-red-200/50'
    };
    return colors[status] || 'bg-gray-100/80 text-gray-700 border-gray-200/50';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100/80 text-green-700 border-green-200/50',
      medium: 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50',
      high: 'bg-orange-100/80 text-orange-700 border-orange-200/50',
      urgent: 'bg-red-100/80 text-red-700 border-red-200/50'
    };
    return colors[priority] || 'bg-gray-100/80 text-gray-700 border-gray-200/50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-4">
            <LoadingSpinner size="lg" className="text-blue-600" />
          </div>
          <p className="mt-3 text-gray-600 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-0">
      {/* Welcome Header with Glass Effect */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl mb-0 font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 mb-0">
                  Here's what's happening with your projects today.
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadDashboardData}
              className="bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
            <Link to="/projects">
              <Button 
                variant="primary" 
                icon={PlusIcon}
                iconPosition="left"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0"
              >
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards with Glass Effect */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Projects',
            value: stats.totalProjects,
            icon: FolderIcon,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'from-blue-50/70 to-cyan-50/70'
          },
          {
            title: 'Active Projects', 
            value: stats.activeProjects,
            icon: CheckCircleIcon,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'from-green-50/70 to-emerald-50/70'
          },
          {
            title: 'Completed Tasks',
            value: stats.completedTasks,
            icon: CheckCircleIcon,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50/70 to-pink-50/70'
          },
          {
            title: 'Team Members',
            value: stats.teamMembers,
            icon: UsersIcon,
            color: 'from-orange-500 to-red-500',
            bgColor: 'from-orange-50/70 to-red-50/70'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
            
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FolderIcon className="h-5 w-5 mr-2 text-blue-600" />
              Recent Projects
            </h2>
            <Link to="/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
              View all
            </Link>
          </div>
          
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project, index) => (
                <Link 
                  key={project._id || index} 
                  to={`/projects/${project._id}`}
                  className="block p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/70 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{project.description?.substring(0, 60)}...</p>
                      {project.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 border ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 ml-3">
                      {project.team && project.team.length > 0 && (
                        <div className="flex -space-x-2">
                          {project.team.slice(0, 3).map((member, i) => (
                            <div key={i} className="relative">
                              {member.user?.avatar ? (
                                <img 
                                  src={member.user.avatar} 
                                  alt={member.user.name}
                                  className="h-6 w-6 rounded-full object-cover ring-2 ring-white shadow-sm"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white shadow-sm">
                                  {member.user?.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                          {project.team.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 ring-2 ring-white shadow-sm">
                              +{project.team.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No projects yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
              Recent Activity
            </h2>
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 8).map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50">
                  <div className="flex-shrink-0">
                    {activity.type === 'project_active' && (
                      <div className="p-2 bg-blue-100/80 rounded-lg">
                        <FolderIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'task_completed' && (
                      <div className="p-2 bg-green-100/80 rounded-lg">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === 'task_updated' && (
                      <div className="p-2 bg-yellow-100/80 rounded-lg">
                        <ClockIcon className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}
                    {activity.type === 'project_updated' && (
                      <div className="p-2 bg-purple-100/80 rounded-lg">
                        <FolderIcon className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    {activity.type === 'welcome' && (
                      <div className="p-2 bg-indigo-100/80 rounded-lg">
                        <SparklesIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-tight">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FireIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions with Glass Effect */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/projects">
            <div className="group p-6 bg-gradient-to-br from-blue-50/70 to-cyan-50/70 backdrop-blur-sm rounded-xl border-2 border-dashed border-blue-200/50 hover:border-blue-400/70 hover:bg-blue-100/70 transition-all duration-300 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Start New Project</h3>
                <p className="text-xs text-gray-600">Create and organize your next big idea</p>
              </div>
            </div>
          </Link>

          <Link to="/ideas">
            <div className="group p-6 bg-gradient-to-br from-purple-50/70 to-pink-50/70 backdrop-blur-sm rounded-xl border-2 border-dashed border-purple-200/50 hover:border-purple-400/70 hover:bg-purple-100/70 transition-all duration-300 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <LightBulbIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Submit Idea</h3>
                <p className="text-xs text-gray-600">Share your innovative thoughts</p>
              </div>
            </div>
          </Link>

          <Link to="/analytics">
            <div className="group p-6 bg-gradient-to-br from-green-50/70 to-emerald-50/70 backdrop-blur-sm rounded-xl border-2 border-dashed border-green-200/50 hover:border-green-400/70 hover:bg-green-100/70 transition-all duration-300 text-center relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">View Analytics</h3>
                <p className="text-xs text-gray-600">Track your team's progress</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;