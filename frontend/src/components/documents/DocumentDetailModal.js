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
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Document Details" className="backdrop-blur-xl">
      <div className="space-y-6 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full -translate-y-8 translate-x-8 -z-10"></div>
        
        {/* Header */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-5 -translate-x-5"></div>
          
          <div className="flex items-center space-x-3 mb-4 relative">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex space-x-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 shadow-sm ${getDocumentTypeColor(document.type)}`}>
                {document.type.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 shadow-sm ${getStatusColor(document.status)}`}>
                {document.status}
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4 relative">{document.title}</h2>
          
          {/* Document Stats */}
          <div className="grid grid-cols-3 gap-4 relative">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
              <HashtagIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-700">Version {document.currentVersion}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
              <DocumentTextIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-700">{document.wordCount} words</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
              <ClockIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-700">{document.versions?.length || 1} revision{(document.versions?.length || 1) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6 relative overflow-hidden">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-2 text-purple-600" />
            Content Preview
          </h4>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 max-h-64 overflow-y-auto border border-white/30 shadow-sm">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {document.content}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6 space-y-4 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-indigo-100/50 to-transparent rounded-full translate-y-4 translate-x-4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-purple-600" />
                Creator
              </h5>
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {getUserInitials(document.creator.name)}
                  </span>
                </div>
                <div>
                  <p className="text-sm mb-0 font-semibold text-gray-900">{document.creator.name}</p>
                  <p className="text-xs mb-0 text-gray-600 font-medium">Created {formatDate(document.createdAt)}</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <PencilIcon className="h-4 w-4 mr-2 text-purple-600" />
                Last Edited By
              </h5>
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {getUserInitials(document.lastEditedBy.name)}
                  </span>
                </div>
                <div>
                  <p className="text-sm mb-0 font-semibold text-gray-900">{document.lastEditedBy.name}</p>
                  <p className="text-xs mb-0 text-gray-600 font-medium">
                    {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version History Summary */}
        {document.versions && document.versions.length > 0 && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-green-100/50 to-transparent rounded-full -translate-y-4 -translate-x-4"></div>
            
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center relative">
              <ClockIcon className="h-4 w-4 mr-2 text-purple-600" />
              Recent Changes
            </h4>
            <div className="space-y-3 max-h-40 overflow-y-auto relative">
              {document.versions.slice(-3).reverse().map((version, index) => (
                <div key={version.versionNumber} className="flex items-center justify-between text-xs bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-sm hover:bg-white/70 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-purple-700 bg-purple-100/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/30">v{version.versionNumber}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-700">{version.editedBy.name}</span>
                    <span className="text-gray-400">•</span>
                    <span className={`px-3 py-1 rounded-lg font-bold backdrop-blur-sm border border-white/30 shadow-sm ${
                      version.changeType === 'major' ? 'bg-red-100/70 text-red-700' : 
                      version.changeType === 'minor' ? 'bg-yellow-100/70 text-yellow-700' : 
                      'bg-green-100/70 text-green-700'
                    }`}>
                      {version.changeType}
                    </span>
                  </div>
                  <span className="font-medium text-gray-600">{formatDistanceToNow(new Date(version.editedAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <TagIcon className="h-4 w-4 mr-2 text-purple-600" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-3">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-white/60 backdrop-blur-sm text-gray-700 border border-white/30 shadow-sm hover:bg-white/70 transition-all duration-200"
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