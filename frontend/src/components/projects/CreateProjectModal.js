import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { projectService } from '../../services/projectService';
import {
  FolderIcon,
  SparklesIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange'
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Format the data
      const projectData = {
        ...data,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      const response = await projectService.createProject(projectData);
      
      toast.success('Project created successfully!');
      onProjectCreated(response.data.project);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      maxWidth="max-w-2xl"
    >
      <div className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-2xl p-1">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
          {/* Header with Icon */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-200/50">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg mb-0 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create New Project
              </h3>
              <p className="text-sm mb-0 text-gray-600">Set up your next big idea</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Project Title *
                </label>
                <input
                  {...register('title', {
                    required: 'Project title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                    maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
                  })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-gray-900"
                  placeholder="Enter project title"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Select category</option>
                  <option value="software">Software</option>
                  <option value="marketing">Marketing</option>
                  <option value="design">Design</option>
                  <option value="research">Research</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-3">
                  Priority *
                </label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                {errors.priority && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.priority.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-3">
                  Status
                </label>
                <select
                  {...register('status')}
                  defaultValue="planning"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Dates */}
              <div>
                <label htmlFor="startDate" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <CalendarIcon className="h-4 w-4 mr-2 text-green-500" />
                  Start Date
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="deadline" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <CalendarIcon className="h-4 w-4 mr-2 text-red-500" />
                  Deadline
                </label>
                <input
                  {...register('deadline')}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label htmlFor="tags" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <TagIcon className="h-4 w-4 mr-2 text-purple-500" />
                  Tags
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-gray-900"
                  placeholder="Enter tags separated by commas (e.g., frontend, react, mobile)"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                Description *
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' }
                })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-gray-900 resize-none"
                placeholder="Describe your project goals, objectives, and key details..."
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Project Settings */}
            <div className="bg-gradient-to-r from-gray-50/70 to-blue-50/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4">
                <Cog6ToothIcon className="h-4 w-4 mr-2 text-indigo-500" />
                Project Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-white/50 rounded-lg border border-white/30">
                  <input
                    {...register('settings.isPublic')}
                    id="isPublic"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  />
                  <label htmlFor="isPublic" className="ml-3 block text-sm font-medium text-gray-900">
                    Make this project public
                  </label>
                </div>

                <div className="flex items-center p-3 bg-white/50 rounded-lg border border-white/30">
                  <input
                    {...register('settings.allowGuestAccess')}
                    id="allowGuestAccess"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  />
                  <label htmlFor="allowGuestAccess" className="ml-3 block text-sm font-medium text-gray-900">
                    Allow guest access
                  </label>
                </div>

                <div className="flex items-center p-3 bg-white/50 rounded-lg border border-white/30">
                  <input
                    {...register('settings.notifications')}
                    id="notifications"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  />
                  <label htmlFor="notifications" className="ml-3 block text-sm font-medium text-gray-900">
                    Enable notifications
                  </label>
                </div>
              </div>
            </div>

            {/* Budget (Optional) */}
            <div className="bg-gradient-to-r from-green-50/70 to-emerald-50/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 text-emerald-500" />
                Budget (Optional)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget.allocated" className="block text-sm font-medium text-gray-700 mb-2">
                    Allocated Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-900 font-medium">$</span>
                    <input
                      {...register('budget.allocated', {
                        min: { value: 0, message: 'Budget must be positive' }
                      })}
                      type="number"
                      step="0.01"
                      className="pl-8 w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-900 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.budget?.allocated && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.budget.allocated.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200/50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:bg-white/70 text-gray-700 hover:text-gray-900 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={!isValid}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;