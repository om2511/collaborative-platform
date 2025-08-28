import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { projectService } from '../../services/projectService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import TaskBoard from '../tasks/TaskBoard';
import ErrorBoundary from '../common/ErrorBoundary';
import Ideas from '../ideas/Ideas';
import CollaborativeWhiteboard from '../whiteboard/CollaborativeWhiteboard';
import Chat from '../chat/Chat';
import Documents from '../documents/Documents';
import Modal from '../common/Modal';
import {
  ArrowLeftIcon,
  PencilIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  LightBulbIcon,
  RectangleGroupIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon,
  ClipboardIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinProject, leaveProject, onlineUsers } = useSocket();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    category: '',
    tags: '',
    startDate: '',
    deadline: ''
  });

  useEffect(() => {
    if (id) {
      loadProject();
      joinProject(id);
    }

    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.menu-dropdown')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const response = await projectService.getProject(id);
      const projectData = response.data.project;
      setProject(projectData);
      
      // Populate edit form with current project data
      setEditForm({
        title: projectData.title || '',
        description: projectData.description || '',
        status: projectData.status || '',
        priority: projectData.priority || '',
        category: projectData.category || '',
        tags: projectData.tags ? projectData.tags.join(', ') : '',
        startDate: projectData.startDate ? projectData.startDate.split('T')[0] : '',
        deadline: projectData.deadline ? projectData.deadline.split('T')[0] : ''
      });
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...editForm,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      const response = await projectService.updateProject(id, formData);
      setProject(response.data.project);
      setIsEditModalOpen(false);
      toast.success('Project updated successfully');
    } catch (error) {
      toast.error('Failed to update project');
      console.error('Update error:', error);
    }
  };

  // Handle project deletion
  const handleDelete = async () => {
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Delete error:', error);
    }
  };

  // Handle copy project link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Project link copied to clipboard');
  };

  // Handle share project
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: project.description,
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'tasks', name: 'Tasks', icon: RectangleGroupIcon },
    { id: 'ideas', name: 'Ideas', icon: LightBulbIcon },
    { id: 'whiteboard', name: 'Whiteboard', icon: RectangleGroupIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftIcon }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Top Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="primary"
                size="sm"
                icon={ArrowLeftIcon}
                iconPosition="left"
                onClick={() => navigate('/projects')}
                className="sm:mr-2"
              >
                <span className="hidden sm:inline">Back to Projects</span>
                <span className="sm:hidden">Back</span>
              </Button>
              
              <div className="h-6 border-l border-gray-300 hidden sm:block"></div>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority} priority
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3">
              {/* Online Users */}
              {onlineUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {onlineUsers.slice(0, 3).map((user, index) => (
                      <div
                        key={user.id}
                        className="relative h-8 w-8 rounded-full bg-gray-300 border-2 border-white"
                        title={user.name}
                      >
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {onlineUsers.length} online
                  </span>
                </div>
              )}

              <Button 
                variant="primary"
                size="sm"
                icon={PencilIcon}
                iconPosition="left"
                onClick={() => setIsEditModalOpen(true)}
                className="hidden sm:flex"
              >
                Edit
              </Button>
              
              <Button 
                variant="primary"
                size="sm"
                icon={PencilIcon}
                iconPosition="left"
                onClick={() => setIsEditModalOpen(true)}
                className="sm:hidden flex"
              />
              
              <div className="relative menu-dropdown">
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </Button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleShare();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ShareIcon className="h-4 w-4 mr-3" />
                        Share Project
                      </button>
                      
                      <button
                        onClick={() => {
                          handleCopyLink();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ClipboardIcon className="h-4 w-4 mr-3" />
                        Copy Link
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/projects');
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <EyeIcon className="h-4 w-4 mr-3" />
                        View All Projects
                      </button>
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={() => {
                          setIsDeleteModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-3" />
                        Delete Project
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{project.team.length} team members</span>
                </div>
                
                {project.startDate && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Started {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                )}

                {project.deadline && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Due {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-1 capitalize truncate">{project.category}</span>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Circle */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - (project.progress || 0) / 100)}`}
                    className="text-primary-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-gray-900">{project.progress || 0}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Team Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {project.team.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="h-6 w-6 rounded-full bg-gray-300 flex-shrink-0">
                    {member.user.avatar ? (
                      <img 
                        src={member.user.avatar} 
                        alt={member.user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                        {member.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{member.user.name}</div>
                    <div className="text-xs text-gray-500 capitalize truncate">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex overflow-x-auto space-x-6 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center flex-shrink-0`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Project Overview</h3>
              <span className="text-sm text-gray-500">Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-blue-900">Progress</div>
                    <div className="text-lg font-semibold text-blue-600">{project.progress || 0}%</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-green-900">Team Size</div>
                    <div className="text-lg font-semibold text-green-600">{project.team.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <RectangleGroupIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-yellow-900">Status</div>
                    <div className="text-lg font-semibold text-yellow-600 capitalize">{project.status.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-purple-900">Created</div>
                    <div className="text-lg font-semibold text-purple-600">{new Date(project.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-base font-medium text-gray-900 mb-4">Project Information</h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Category</dt>
                    <dd className="text-sm text-gray-900 capitalize">{project.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Priority</dt>
                    <dd className="text-sm text-gray-900 capitalize">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority} priority
                      </span>
                    </dd>
                  </div>
                  {project.startDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-700">Start Date</dt>
                      <dd className="text-sm text-gray-900">{new Date(project.startDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {project.deadline && (
                    <div>
                      <dt className="text-sm font-medium text-gray-700">Deadline</dt>
                      <dd className="text-sm text-gray-900">{new Date(project.deadline).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Team Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-base font-medium text-gray-900 mb-4">Team Overview</h4>
                <div className="space-y-3">
                  {project.team.slice(0, 5).map((member, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0">
                        {member.user.avatar ? (
                          <img 
                            src={member.user.avatar} 
                            alt={member.user.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                            {member.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{member.user.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                      </div>
                    </div>
                  ))}
                  {project.team.length > 5 && (
                    <div className="text-sm text-gray-500 text-center pt-2">
                      +{project.team.length - 5} more members
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-base font-medium text-gray-900 mb-3">Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <ErrorBoundary>
            <TaskBoard />
          </ErrorBoundary>
        )}

        {activeTab === 'ideas' && <Ideas />}

        {activeTab === 'whiteboard' && (
          <CollaborativeWhiteboard projectId={project._id} />
        )}

        {activeTab === 'documents' && (
          <div className="h-[600px]">
            <Documents />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[600px]">
            <Chat />
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.status}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.priority}
                onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.category}
                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.tags}
                onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.startDate}
                onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={editForm.deadline}
                onChange={(e) => setEditForm({...editForm, deadline: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-medium text-gray-900">Are you sure?</h4>
              <p className="text-sm text-gray-600">
                This action cannot be undone. This will permanently delete the project and all associated data.
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">
              <strong>Project to be deleted:</strong> {project.title}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;