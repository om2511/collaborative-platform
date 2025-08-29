import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { taskService, projectService } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const EditTaskModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    tags: '',
    estimatedHours: ''
  });
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when task changes
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignee: task.assignee?._id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        tags: (task.labels || task.tags || []).join(', '),
        estimatedHours: task.estimatedHours || ''
      });
      
      if (task.project) {
        loadTeamMembers(task.project);
      }
    }
  }, [task, isOpen]);

  const loadTeamMembers = async (projectId) => {
    try {
      setIsLoading(true);
      const response = await projectService.getProject(projectId);
      const project = response.data?.project;
      
      if (project && project.team) {
        setTeamMembers(project.team);
      } else {
        setTeamMembers([]);
        console.warn('Project or team data not found');
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData = {
        ...formData,
        labels: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        dueDate: formData.dueDate || null,
        assignee: formData.assignee || null
      };

      // Remove tags field since we're using labels
      delete updateData.tags;

      const response = await taskService.updateTask(task._id, updateData);
      const updatedTask = response.data.task;
      
      toast.success('Task updated successfully');
      onTaskUpdated(updatedTask);
      handleClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      tags: '',
      estimatedHours: ''
    });
    onClose();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-700',
      medium: 'text-yellow-700',
      high: 'text-orange-700',
      urgent: 'text-red-700'
    };
    return colors[priority] || 'text-gray-700';
  };

  if (!isOpen || !task) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Task">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm resize-none"
              placeholder="Describe the task..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className={`w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${getPriorityColor(formData.priority)}`}
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignee" className="block text-sm font-semibold text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-2 text-blue-600" />
                Assignee
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                  <LoadingSpinner size="sm" className="text-blue-600" />
                </div>
              ) : (
                <select
                  id="assignee"
                  name="assignee"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  value={formData.assignee}
                  onChange={handleInputChange}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-2 text-blue-600" />
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Tags and Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline mr-2 text-blue-600" />
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
                placeholder="frontend, bug, feature (comma separated)"
                value={formData.tags}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimatedHours"
                name="estimatedHours"
                min="0"
                step="0.5"
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
                placeholder="8"
                value={formData.estimatedHours}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Priority Warning */}
          {formData.priority === 'urgent' && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 shadow-sm">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">
                    This task is marked as urgent. Team members will be notified of changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200/50">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Task'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditTaskModal;