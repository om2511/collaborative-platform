import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';
import Button from '../common/Button';
import {
  DocumentTextIcon,
  LockClosedIcon,
  LockOpenIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const DocumentEditor = ({ document, isCreating, projectId, onDocumentSaved, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [type, setType] = useState(document?.type || 'note');
  const [status, setStatus] = useState(document?.status || 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLocked, setIsLocked] = useState(document?.isLocked || false);
  const [lockedBy, setLockedBy] = useState(document?.lockedBy || null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  const autoSaveIntervalRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // Calculate stats when content changes
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setCharacterCount(content.length);
    
    // Mark as having unsaved changes
    if (!isCreating && document && (content !== document.content || title !== document.title)) {
      setHasUnsavedChanges(true);
    }
  }, [content, title, document, isCreating]);

  useEffect(() => {
    // Auto-save functionality
    if (autoSaveEnabled && hasUnsavedChanges && !isCreating) {
      autoSaveIntervalRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
    };
  }, [content, title, hasUnsavedChanges, autoSaveEnabled, isCreating]);

  useEffect(() => {
    // Lock document when editing (if not creating)
    if (!isCreating && document) {
      handleLockDocument();
    }

    // Cleanup: unlock document when unmounting
    return () => {
      if (!isCreating && document && isLocked && lockedBy?._id === user._id) {
        handleUnlockDocument();
      }
    };
  }, []);

  const handleLockDocument = async () => {
    try {
      // Simulated API call
      // await documentService.lockDocument(document._id);
      setIsLocked(true);
      setLockedBy(user);
    } catch (error) {
      console.error('Error locking document:', error);
    }
  };

  const handleUnlockDocument = async () => {
    try {
      // Simulated API call
      // await documentService.unlockDocument(document._id);
      setIsLocked(false);
      setLockedBy(null);
    } catch (error) {
      console.error('Error unlocking document:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!hasUnsavedChanges || isSaving || !document?._id) return;

    try {
      setIsSaving(true);
      
      // Real auto-save API call
      await documentService.updateDocument(document._id, {
        title,
        content,
        changeType: 'minor',
        changes: 'Auto-save'
      });
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Don't show toast for auto-save to avoid spam
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    try {
      setIsSaving(true);

      const documentData = {
        title: title.trim(),
        content: content.trim(),
        type,
        status,
        project: projectId,
        changeType: 'major',
        changes: isCreating ? 'Initial document creation' : 'Manual save'
      };

      // Real API call
      const response = isCreating 
        ? await documentService.createDocument(documentData)
        : await documentService.updateDocument(document._id, documentData);

      // Extract saved document from API response
      const savedDocument = response.data.data?.document || response.data.document;

      if (!savedDocument) {
        throw new Error('Invalid response from server');
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      onDocumentSaved(savedDocument);
      
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const getReadingTime = () => {
    return Math.ceil(wordCount / 200); // Assuming 200 words per minute
  };

  return (
    <div className="h-full flex flex-col relative" onKeyDown={handleKeyDown}>
      {/* Editor Header */}
      <div className="p-6 border-b border-white/30 bg-white/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-8 -translate-x-8"></div>
        
        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {isCreating ? 'Create New Document' : 'Edit Document'}
            </h3>
            
            {/* Lock Status */}
            {!isCreating && (
              <div className="flex items-center text-sm bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                {isLocked ? (
                  <div className="flex items-center text-yellow-700">
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {lockedBy?._id === user._id ? 'Locked by you' : `Locked by ${lockedBy?.name}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-700">
                    <LockOpenIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">Available for editing</span>
                  </div>
                )}
              </div>
            )}

            {/* Save Status */}
            {!isCreating && (
              <div className="flex items-center text-sm bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                {isSaving ? (
                  <div className="flex items-center text-indigo-700">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    <span className="font-medium">Saving...</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center text-amber-700">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">Unsaved changes</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center text-green-700">
                    <CheckIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-save toggle */}
            {!isCreating && (
              <div className="flex items-center text-sm bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 shadow-sm">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                />
                <label className="font-medium text-gray-700 cursor-pointer">Auto-save</label>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={onCancel}
              className="bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
            >
              Cancel
            </Button>
            
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
            >
              {isSaving ? 'Saving...' : (isCreating ? 'Create' : 'Save')}
            </Button>
          </div>
        </div>

        {/* Document Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 shadow-sm transition-all duration-200 hover:bg-white/60"
              maxLength={200}
              disabled={isLocked && lockedBy?._id !== user._id}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 shadow-sm transition-all duration-200 hover:bg-white/60"
              disabled={isLocked && lockedBy?._id !== user._id}
            >
              <option value="note">Note</option>
              <option value="specification">Specification</option>
              <option value="meeting_minutes">Meeting Minutes</option>
              <option value="guide">Guide</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 shadow-sm transition-all duration-200 hover:bg-white/60"
              disabled={isLocked && lockedBy?._id !== user._id}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 m-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 shadow-inner relative overflow-hidden">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your document..."
            className="w-full h-full p-6 bg-transparent border-none focus:outline-none resize-none font-mono text-sm leading-relaxed text-gray-800 placeholder-gray-500"
            disabled={isLocked && lockedBy?._id !== user._id}
          />
        </div>
      </div>

      {/* Editor Footer */}
      <div className="p-6 border-t border-white/30 bg-white/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-100/50 to-transparent rounded-full translate-y-5 translate-x-5"></div>
        
        <div className="flex items-center justify-between text-sm relative">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
              <DocumentTextIcon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">{wordCount} words</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
              <span className="font-medium text-gray-700">{characterCount} characters</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
              <ClockIcon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">{getReadingTime()} min read</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 shadow-sm">
            <ClockIcon className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-700">Press Ctrl+S to save</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;