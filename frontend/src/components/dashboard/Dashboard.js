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
  ArrowPathIcon
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
              user: user.name
            });
          });
        }
        
        // Add recent ideas as activities
        if (dashboardData.recentIdeas && Array.isArray(dashboardData.recentIdeas)) {
          dashboardData.recentIdeas.slice(0, 2).forEach((idea, index) => {
            dashboardActivity.push({
              id: `idea_${idea._id || index + 1}`,
              type: 'idea_created',
              message: `New idea "${idea.title}" was submitted`,
              time: idea.createdAt ? formatTimeAgo(idea.createdAt) : 'Recently',
              user: user.name
            });
          });
        }
        
        // Add upcoming deadlines as activities
        if (dashboardData.upcomingDeadlines && Array.isArray(dashboardData.upcomingDeadlines)) {
          dashboardData.upcomingDeadlines.slice(0, 2).forEach((task, index) => {
            dashboardActivity.push({
              id: `deadline_${task._id || index + 1}`,
              type: 'deadline_approaching',
              message: `Task "${task.title}" is due soon`,
              time: task.dueDate ? formatTimeAgo(task.dueDate) : 'Soon',
              user: user.name
            });
          });
        }
        
        if (dashboardActivity.length > 0) {
          setRecentActivity(dashboardActivity.slice(0, 5));
        } else {
          // Show a helpful message when no recent activity
          setRecentActivity([
            {
              id: 1,
              type: 'welcome',
              message: 'No recent activity. Start by creating a project or task to see updates here.',
              time: 'Just now',
              user: user.name
            }
          ]);
        }
        
      } catch (dashboardError) {
        console.error('Could not load dashboard analytics:', dashboardError);
        // Fallback to project-based activity
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
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-0">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Here's what's happening with your projects today.
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                loadDashboardData();
              }}
              className="w-auto"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
            <Link to="/projects">
              <Button 
                variant="primary" 
                icon={PlusIcon}
                iconPosition="left"
                className="w-full sm:w-auto"
              >
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-blue-100 flex-shrink-0">
              <FolderIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-purple-100 flex-shrink-0">
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-green-100 flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Tasks Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-orange-100 flex-shrink-0">
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Team Members</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.teamMembers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap">
              View all
            </Link>
          </div>

          {!Array.isArray(projects) || projects.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <FolderIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No projects yet</p>
              <Link to="/projects">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  Create your first project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(projects) && projects.slice(0, 5).map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="block p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start sm:items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate mt-1">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap items-center mt-2 gap-1 sm:gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <div className="flex -space-x-1">
                        {project.team.slice(0, 2).map((member, index) => (
                          <div
                            key={index}
                            className="relative h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-300 border-2 border-white"
                            title={member.user.name}
                          >
                            {member.user.avatar ? (
                              <img 
                                src={member.user.avatar} 
                                alt={member.user.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white text-xs">
                                {member.user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                        {project.team.length > 2 && (
                          <div className="relative h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{project.team.length - 2}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          {!Array.isArray(recentActivity) || recentActivity.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <ChartBarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {Array.isArray(recentActivity) && recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.type === 'project_created' && (
                      <div className="p-1 rounded-full bg-blue-100">
                        <FolderIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'task_completed' && (
                      <div className="p-1 rounded-full bg-green-100">
                        <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === 'idea_submitted' && (
                      <div className="p-1 rounded-full bg-yellow-100">
                        <LightBulbIcon className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 leading-tight">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link to="/projects">
            <div className="p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors text-center">
              <PlusIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-medium text-gray-900">Start New Project</h3>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Create and organize your next big idea</p>
            </div>
          </Link>

          <Link to="/ideas">
            <div className="p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors text-center">
              <LightBulbIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-medium text-gray-900">Submit Idea</h3>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Share your innovative thoughts</p>
            </div>
          </Link>

          <Link to="/analytics">
            <div className="p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors text-center sm:col-span-2 lg:col-span-1">
              <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-medium text-gray-900">View Analytics</h3>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Track your team's progress</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;