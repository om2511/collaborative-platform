import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Modal from '../common/Modal';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  HashtagIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const DocumentDetailModal = ({ isOpen, onClose, document }) => {
  if (!document) return null;

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      note: 'bg-blue-100 text-blue-800',
      specification: 'bg-purple-100 text-purple-800',
      meeting_minutes: 'bg-green-100 text-green-800',
      guide: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Document Details">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(document.type)}`}>
              {document.type.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
              {document.status}
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{document.title}</h2>
          
          {/* Document Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <HashtagIcon className="h-4 w-4" />
              <span>Version {document.currentVersion}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{document.wordCount} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{document.versions?.length || 1} revision{(document.versions?.length || 1) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {document.content}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                Creator
              </h5>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getUserInitials(document.creator.name)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{document.creator.name}</p>
                  <p className="text-xs text-gray-500">Created {formatDate(document.createdAt)}</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <PencilIcon className="h-4 w-4 mr-1" />
                Last Edited By
              </h5>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-secondary-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getUserInitials(document.lastEditedBy.name)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{document.lastEditedBy.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version History Summary */}
        {document.versions && document.versions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              Recent Changes
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {document.versions.slice(-3).reverse().map((version, index) => (
                <div key={version.versionNumber} className="flex items-center justify-between text-xs text-gray-600 bg-white rounded p-2 border">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">v{version.versionNumber}</span>
                    <span>•</span>
                    <span>{version.editedBy.name}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded ${
                      version.changeType === 'major' ? 'bg-red-100 text-red-700' : 
                      version.changeType === 'minor' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {version.changeType}
                    </span>
                  </div>
                  <span>{formatDistanceToNow(new Date(version.editedAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TagIcon className="h-4 w-4 mr-1" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentDetailModal;