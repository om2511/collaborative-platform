import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import {
  EyeIcon,
  PencilIcon,
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const DocumentList = ({ 
  documents, 
  onSelectDocument, 
  onViewVersions, 
  onViewDocument,
  onDeleteDocument,
  getDocumentTypeIcon, 
  getDocumentTypeColor 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || doc.type === filterType;
    const matchesStatus = !filterStatus || doc.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const canDelete = (document) => {
    // Allow deletion if user is the creator or has admin/manager role
    return (
      user._id === document.creator._id ||
      user.role === 'admin' ||
      user.role === 'manager'
    );
  };

  const handleDelete = (document) => {
    if (window.confirm(`Are you sure you want to delete "${document.title}"? This action cannot be undone.`)) {
      onDeleteDocument && onDeleteDocument(document._id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="note">Note</option>
            <option value="specification">Specification</option>
            <option value="meeting_minutes">Meeting Minutes</option>
            <option value="guide">Guide</option>
            <option value="other">Other</option>
          </select>
          
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        {(searchTerm || filterType || filterStatus) && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {filteredDocuments.length} documents found
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterStatus('');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your search'}
            </h4>
            <p className="text-gray-400 max-w-sm">
              {documents.length === 0 
                ? 'Create your first document to get started with collaborative editing and version control.'
                : 'Try adjusting your search criteria or filters to find the documents you\'re looking for.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => {
              const TypeIcon = getDocumentTypeIcon(document.type);
              
              return (
                <div
                  key={document._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title and Type */}
                      <div className="flex items-center space-x-3 mb-2">
                        <TypeIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        <h4 
                          className="text-lg font-medium text-gray-900 truncate cursor-pointer hover:text-primary-600"
                          onClick={() => onSelectDocument(document)}
                        >
                          {document.title}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(document.type)}`}>
                          {document.type.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {document.status}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {document.content.substring(0, 150)}
                        {document.content.length > 150 ? '...' : ''}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-medium">
                              {getUserInitials(document.creator.name)}
                            </span>
                          </div>
                          <span>Created by {document.creator.name}</span>
                        </div>
                        
                        <span>•</span>
                        
                        <span>
                          Last edited {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                        </span>
                        
                        <span>•</span>
                        
                        <span>
                          Version {document.currentVersion}
                        </span>
                        
                        <span>•</span>
                        
                        <span>
                          {document.wordCount} words
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onViewDocument && onViewDocument(document)}
                        title="View document"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectDocument(document)}
                        title="Edit document"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onViewVersions(document)}
                        title="View version history"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </Button>

                      {canDelete(document) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(document)}
                          title="Delete document"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;