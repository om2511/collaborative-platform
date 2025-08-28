import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectService } from '../../services/projectService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import CreateProjectModal from './CreateProjectModal';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, filters]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.data.projects);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(project => project.priority === filters.priority);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(project => project.category === filters.category);
    }

    setFilteredProjects(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      category: ''
    });
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setShowCreateModal(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/50',
      active: 'bg-green-100/80 text-green-700 border border-green-200/50',
      on_hold: 'bg-gray-100/80 text-gray-700 border border-gray-200/50',
      review: 'bg-blue-100/80 text-blue-700 border border-blue-200/50',
      completed: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50',
      cancelled: 'bg-red-100/80 text-red-700 border border-red-200/50'
    };
    return colors[status] || 'bg-gray-100/80 text-gray-700 border border-gray-200/50';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100/80 text-green-700 border border-green-200/50',
      medium: 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/50',
      high: 'bg-orange-100/80 text-orange-700 border border-orange-200/50',
      urgent: 'bg-red-100/80 text-red-700 border border-red-200/50'
    };
    return colors[priority] || 'bg-gray-100/80 text-gray-700 border border-gray-200/50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-4">
            <LoadingSpinner size="lg" className="text-blue-600" />
          </div>
          <p className="mt-3 text-gray-600 text-sm font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-0">
      {/* Header with Glass Effect */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FolderIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl mb-0 font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Projects
                </h1>
                <p className="text-gray-600 mb-0">
                  Manage and collaborate on your projects
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              icon={PlusIcon}
              iconPosition="left"
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0 w-full sm:w-auto"
            >
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Filters with Glass Effect */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900" />
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-10 w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-gray-900"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="software">Software</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design</option>
              <option value="research">Research</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.status || filters.priority || filters.category) && (
          <div className="mt-4 flex items-center justify-between p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
            <span className="text-sm text-gray-600 font-medium">
              {filteredProjects.length} of {projects.length} projects
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70 text-gray-700 hover:text-gray-900"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100/80 backdrop-blur-sm rounded-2xl mb-6">
              <FolderIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {projects.length === 0 
                ? 'Get started by creating your first project and begin collaborating with your team'
                : 'Try adjusting your search criteria to find the projects you\'re looking for'
              }
            </p>
            {projects.length === 0 && (
              <Button
                variant="primary"
                icon={PlusIcon}
                iconPosition="left"
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0"
              >
                Create Project
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="group block bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
                  {project.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    <span>{project.team.length} members</span>
                  </div>

                  {project.deadline && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team Avatars */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 4).map((member, index) => (
                      <div
                        key={index}
                        className="relative h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white shadow-sm"
                        title={member.user.name}
                      >
                        {member.user.avatar ? (
                          <img 
                            src={member.user.avatar} 
                            alt={member.user.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                            {member.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {project.team.length > 4 && (
                      <div className="relative h-8 w-8 rounded-full bg-gray-100/80 backdrop-blur-sm border-2 border-white flex items-center justify-center shadow-sm">
                        <span className="text-xs text-gray-600 font-medium">
                          +{project.team.length - 4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-24">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200/70 rounded-full h-2 backdrop-blur-sm">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Projects;