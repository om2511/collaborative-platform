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
    <div className="h-full flex flex-col relative">
      {/* Filters */}
      <div className="p-6 border-b border-white/30 backdrop-blur-sm relative">
        <div className="flex items-center space-x-3 mb-4">
          <FunnelIcon className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Filter Documents</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 shadow-sm transition-all duration-200 hover:bg-white/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 shadow-sm transition-all duration-200 hover:bg-white/60"
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
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 shadow-sm transition-all duration-200 hover:bg-white/60"
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
          <div className="mt-4 flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
            <span className="text-sm font-medium text-gray-700">
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
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto relative">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 relative">
            <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
              <DocumentTextIcon className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                {documents.length === 0 ? 'No documents yet' : 'No documents match your search'}
              </h4>
              <p className="text-gray-500 max-w-sm">
                {documents.length === 0 
                  ? 'Create your first document to get started with collaborative editing and version control.'
                  : 'Try adjusting your search criteria or filters to find the documents you\'re looking for.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredDocuments.map((document) => {
              const TypeIcon = getDocumentTypeIcon(document.type);
              
              return (
                <div
                  key={document._id}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl hover:bg-white/80 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full -translate-y-5 translate-x-5 group-hover:scale-110 transition-transform duration-300"></div>
                  
                  <div className="flex items-start justify-between relative">
                    <div className="flex-1 min-w-0">
                      {/* Title and Type */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
                          <TypeIcon className="h-5 w-5 text-white flex-shrink-0" />
                        </div>
                        <h4 
                          className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-purple-600 transition-colors duration-200"
                          onClick={() => onSelectDocument(document)}
                        >
                          {document.title}
                        </h4>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 shadow-sm ${getDocumentTypeColor(document.type)}`}>
                            {document.type.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 shadow-sm ${getStatusColor(document.status)}`}>
                            {document.status}
                          </span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="mb-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {document.content.substring(0, 150)}
                          {document.content.length > 150 ? '...' : ''}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">
                              {getUserInitials(document.creator.name)}
                            </span>
                          </div>
                          <span className="font-medium">Created by {document.creator.name}</span>
                        </div>
                        
                        <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-medium">
                            Last edited {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <span className="font-medium">Version {document.currentVersion}</span>
                        </div>
                        
                        <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="font-medium">{document.wordCount} words</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onViewDocument && onViewDocument(document)}
                        title="View document"
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectDocument(document)}
                        title="Edit document"
                        className="bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onViewVersions(document)}
                        title="View version history"
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </Button>

                      {canDelete(document) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(document)}
                          title="Delete document"
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
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