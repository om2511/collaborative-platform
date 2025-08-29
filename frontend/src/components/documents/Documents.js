import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { documentService } from '../../services/documentService';
import DocumentList from './DocumentList';
import DocumentEditor from './DocumentEditor';
import DocumentVersionHistory from './DocumentVersionHistory';
import DocumentDetailModal from './DocumentDetailModal';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Documents = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // 'list', 'editor', 'versions'
  const [isCreating, setIsCreating] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadDocuments();
    }
  }, [projectId]);

  // Socket event listeners
  useEffect(() => {
    if (socket && projectId) {
      socket.on('document_created', (data) => {
        if (data.document.project === projectId) {
          setDocuments(prev => [data.document, ...prev]);
          toast.success(`${data.createdBy.name} created a new document`);
        }
      });

      socket.on('document_updated', (data) => {
        if (data.document.project === projectId) {
          setDocuments(prev => prev.map(doc => 
            doc._id === data.document._id ? data.document : doc
          ));
          if (!data.isAutoSave) {
            toast.success(`Document updated by ${data.updatedBy.name}`);
          }
        }
      });

      socket.on('document_deleted', (data) => {
        setDocuments(prev => prev.filter(doc => doc._id !== data.documentId));
        toast.success(`Document deleted by ${data.deletedBy.name}`);
      });

      return () => {
        socket.off('document_created');
        socket.off('document_updated');
        socket.off('document_deleted');
      };
    }
  }, [socket, projectId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentService.getProjectDocuments(projectId);
      const documentsData = response.data.data?.documents || response.data.documents || [];
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
      // If API fails, show empty state instead of mock data
      setDocuments([]);
      if (error.response?.status !== 404) {
        toast.error('Failed to load documents');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = () => {
    setIsCreating(true);
    setSelectedDocument(null);
    setActiveView('editor');
  };

  const handleSelectDocument = (document) => {
    setSelectedDocument(document);
    setIsCreating(false);
    setActiveView('editor');
  };

  const handleViewVersions = (document) => {
    setSelectedDocument(document);
    setActiveView('versions');
  };

  const handleDocumentSaved = (savedDocument) => {
    if (isCreating) {
      // For new documents, add to the beginning of the list
      setDocuments(prev => [savedDocument, ...prev]);
      setActiveView('list');
    } else {
      // For existing documents, update in place
      setDocuments(prev => prev.map(doc => 
        doc._id === savedDocument._id ? savedDocument : doc
      ));
    }
    setIsCreating(false);
    setSelectedDocument(null);
    toast.success('Document saved successfully');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedDocument(null);
    setIsCreating(false);
  };

  const handleViewDocument = (document) => {
    setViewDocument(document);
    setShowDetailModal(true);
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentTypeIcon = (type) => {
    const icons = {
      note: DocumentTextIcon,
      specification: DocumentTextIcon,
      meeting_minutes: ClockIcon,
      guide: DocumentTextIcon,
      other: DocumentTextIcon
    };
    return icons[type] || DocumentTextIcon;
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

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="flex flex-col items-center justify-center h-96 relative">
          <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
            <DocumentTextIcon className="h-12 w-12 text-indigo-600" />
          </div>
          <LoadingSpinner size="xl" className="mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Documents</h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Setting up your collaborative document workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full -translate-y-10 translate-x-10 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full translate-y-8 -translate-x-8 -z-10"></div>
      
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-5 translate-x-5"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between relative">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {activeView === 'list' ? 'Documents' : 
                 activeView === 'editor' ? (isCreating ? 'Create Document' : 'Edit Document') :
                 'Version History'}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {activeView === 'list' ? 'Manage project documents with version control' :
               activeView === 'editor' ? 'Collaborative document editing with auto-save' :
               'View and manage document version history'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {activeView !== 'list' && (
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
              >
                Back to Documents
              </Button>
            )}
            
            {activeView === 'list' && (
              <Button
                variant="primary"
                icon={PlusIcon}
                iconPosition="left"
                onClick={handleCreateDocument}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
              >
                New Document
              </Button>
            )}

            {activeView === 'editor' && selectedDocument && (
              <Button
                variant="success"
                icon={ClockIcon}
                iconPosition="left"
                onClick={() => handleViewVersions(selectedDocument)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
              >
                Version History
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-8 -translate-x-8"></div>
        
        {activeView === 'list' && (
          <DocumentList
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onViewVersions={handleViewVersions}
            onViewDocument={handleViewDocument}
            onDeleteDocument={handleDeleteDocument}
            getDocumentTypeIcon={getDocumentTypeIcon}
            getDocumentTypeColor={getDocumentTypeColor}
          />
        )}

        {activeView === 'editor' && (
          <DocumentEditor
            document={selectedDocument}
            isCreating={isCreating}
            projectId={projectId}
            onDocumentSaved={handleDocumentSaved}
            onCancel={handleBackToList}
          />
        )}

        {activeView === 'versions' && selectedDocument && (
          <DocumentVersionHistory
            document={selectedDocument}
            onRestoreVersion={(versionNumber) => {
              // Handle version restore
            }}
            onSelectDocument={handleSelectDocument}
          />
        )}
      </div>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setViewDocument(null);
        }}
        document={viewDocument}
      />
    </div>
  );
};

export default Documents;