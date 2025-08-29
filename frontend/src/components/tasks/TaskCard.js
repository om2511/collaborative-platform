import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import {
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  FireIcon
} from '@heroicons/react/24/solid';

const TaskCard = ({ task, onUpdate, onDelete, onEdit, onDragStart, isDragging }) => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  // Safety check for task data
  if (!task || !task._id || !task.title) {
    console.warn('TaskCard received invalid task data:', task);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">Invalid task data</p>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <FireIcon className="h-3 w-3" />;
    if (priority === 'high') return <ExclamationTriangleIcon className="h-3 w-3" />;
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-700 text-white',
      in_progress: 'bg-blue-600 text-white',
      review: 'bg-yellow-500 text-white',
      done: 'bg-green-600 text-white'
    };
    return colors[status] || 'bg-gray-700 text-white';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task.status !== 'done';
  };

  const canEdit = () => {
    if (!user || !user._id) return false;
    // Allow editing if user is the creator, assigned to the task, or has admin/manager role
    return (
      user._id === task.creator?._id || 
      user._id === task.createdBy?._id || 
      user._id === task.assignee?._id ||
      user.role === 'admin' ||
      user.role === 'manager'
    );
  };

  const handleQuickStatusChange = (newStatus) => {
    if (newStatus !== task.status) {
      onUpdate(task._id, { status: newStatus });
    }
  };

  return (
    <div
      className={`bg-white/70 backdrop-blur-xl rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 cursor-move group relative overflow-hidden ${
        isDragging ? 'opacity-50 rotate-3 scale-95' : 'hover:scale-[1.02]'
      } ${isOverdue(task.dueDate) ? 'border-red-300/50' : 'border-white/20'}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/20 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Card Header */}
      <div className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors duration-200">
              {task.title}
            </h5>
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            {/* Priority */}
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border ${getPriorityColor(task.priority)} shadow-sm`}>
              {getPriorityIcon(task.priority)}
              <span className={getPriorityIcon(task.priority) ? 'ml-1.5' : ''}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions (always visible for editable tasks) */}
        {canEdit() && (
          <div className="flex justify-end space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="primary"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(task);
              }}
              className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg border-0"
              title="Edit task"
            >
              <PencilIcon className="h-3 w-3 text-white" />
            </Button>
            <Button
              variant="danger"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete && onDelete(task._id);
                }
              }}
              className="p-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg border-0"
              title="Delete task"
            >
              <TrashIcon className="h-3 w-3 text-white" />
            </Button>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
          <div className="flex items-center space-x-4">
            {/* Assignee */}
            {task.assignee && task.assignee.name && (
              <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                {task.assignee.avatar ? (
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="h-6 w-6 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-white">
                    <span className="text-white text-xs font-medium">
                      {task.assignee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="ml-2 text-xs text-gray-600 font-medium hidden sm:inline">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center text-xs px-2 py-1 rounded-full backdrop-blur-sm ${isOverdue(task.dueDate) ? 'bg-red-100/80 text-red-700' : 'bg-gray-100/80 text-gray-600'} shadow-sm`}>
                <CalendarIcon className="h-3 w-3 mr-1.5" />
                {formatDate(task.dueDate)}
              </div>
            )}

            {/* Comments Count */}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center text-xs bg-gray-100/80 backdrop-blur-sm text-gray-600 px-2 py-1 rounded-full shadow-sm">
                <ChatBubbleLeftIcon className="h-3 w-3 mr-1.5" />
                {task.comments.length}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md border transition-all duration-200 
              ${task.status === 'in_progress' ? 'border-blue-400/50 bg-blue-100/80 text-blue-700' : ''}
              ${task.status === 'todo' ? 'border-gray-400/50 bg-gray-100/80 text-gray-700' : ''}
              ${task.status === 'review' ? 'border-yellow-400/50 bg-yellow-100/80 text-yellow-700' : ''}
              ${task.status === 'done' ? 'border-green-400/50 bg-green-100/80 text-green-700' : ''}
            `}
          >
            {task.status.replace('_', ' ')}
          </div>
        </div>

        {/* Tags/Labels */}
        {(task.labels || task.tags) && (task.labels?.length > 0 || task.tags?.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(task.labels || task.tags || []).slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100/80 backdrop-blur-sm text-indigo-700 border border-indigo-200/50 shadow-sm"
              >
                {tag}
              </span>
            ))}
            {(task.labels || task.tags || []).length > 3 && (
              <span className="text-xs text-gray-500 font-medium bg-gray-100/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-200/50">
                +{(task.labels || task.tags || []).length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-200/50 bg-white/30 backdrop-blur-sm p-5 relative" onClick={(e) => e.stopPropagation()}>
          {/* Full Description */}
          {task.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50">
            <div>
              <span className="font-semibold text-gray-700">Created:</span><br />
              <span className="text-gray-600">{formatDate(task.createdAt)} by {task.creator?.name || task.createdBy?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Updated:</span><br />
              <span className="text-gray-600">{formatDate(task.updatedAt)}</span>
            </div>
          </div>

          {/* Status Change Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['todo', 'in_progress', 'review', 'done'].map((status) => (
              <Button
                key={status}
                variant={task.status === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleQuickStatusChange(status)}
                disabled={task.status === status}
                className={task.status === status ? 
                  'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md border-0' : 
                  'bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 transition-all duration-200'
                }
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>

          {/* Last Updated Info */}
          <div className="flex justify-center items-center pt-3 border-t border-gray-200/50">
            <div className="text-xs text-gray-500 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50">
              <ClockIcon className="h-3 w-3 inline mr-1.5" />
              Last updated {formatDate(task.updatedAt)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;