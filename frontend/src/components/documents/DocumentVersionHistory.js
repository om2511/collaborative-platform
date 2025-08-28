import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import Button from '../common/Button';
import Modal from '../common/Modal';
import {
  ClockIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const DocumentVersionHistory = ({ document, onRestoreVersion, onSelectDocument }) => {
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreVersionNumber, setRestoreVersionNumber] = useState(null);
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [compareMode, setCompareMode] = useState(false);

  const allVersions = [
    {
      versionNumber: document.currentVersion,
      content: document.content,
      editedBy: document.lastEditedBy,
      editedAt: document.updatedAt,
      changes: 'Current version',
      changeType: 'current',
      wordCount: document.wordCount,
      characterCount: document.characterCount,
      isCurrent: true
    },
    ...((document.versions || []).slice().reverse())
  ];

  const getChangeTypeColor = (changeType) => {
    const colors = {
      current: 'bg-blue-100 text-blue-800',
      major: 'bg-red-100 text-red-800',
      minor: 'bg-yellow-100 text-yellow-800',
      patch: 'bg-green-100 text-green-800'
    };
    return colors[changeType] || 'bg-gray-100 text-gray-800';
  };

  const getChangeTypeIcon = (changeType) => {
    const icons = {
      current: EyeIcon,
      major: CodeBracketIcon,
      minor: PencilIcon,
      patch: PencilIcon
    };
    return icons[changeType] || PencilIcon;
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleVersionSelect = (versionNumber) => {
    if (compareMode) {
      setSelectedVersions(prev => {
        const newSelected = prev.includes(versionNumber)
          ? prev.filter(v => v !== versionNumber)
          : prev.length < 2 ? [...prev, versionNumber] : [prev[1], versionNumber];
        return newSelected;
      });
    }
  };

  const handleRestoreVersion = (versionNumber) => {
    setRestoreVersionNumber(versionNumber);
    setShowRestoreModal(true);
  };

  const confirmRestore = () => {
    onRestoreVersion(restoreVersionNumber);
    setShowRestoreModal(false);
    setRestoreVersionNumber(null);
  };

  const toggleVersionExpanded = (versionNumber) => {
    setExpandedVersions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(versionNumber)) {
        newExpanded.delete(versionNumber);
      } else {
        newExpanded.add(versionNumber);
      }
      return newExpanded;
    });
  };

  const getVersionDiff = (version) => {
    // Simple diff visualization - in a real app, you'd use a proper diff library
    return {
      added: version.diff?.added?.length || 0,
      removed: version.diff?.removed?.length || 0,
      modified: version.diff?.modified?.length || 0
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Version history • {allVersions.length} versions
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={compareMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedVersions([]);
              }}
            >
              {compareMode ? 'Exit Compare' : 'Compare Versions'}
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              icon={PencilIcon}
              iconPosition='left'
              onClick={() => onSelectDocument(document)}
            >
              Edit Document
            </Button>
          </div>
        </div>

        {compareMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Select up to 2 versions to compare. 
              {selectedVersions.length === 2 && (
                <span className="ml-2">
                  <Button variant="primary" size="sm" className="ml-2">
                    Compare Selected
                  </Button>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {allVersions.map((version) => {
            const ChangeIcon = getChangeTypeIcon(version.changeType);
            const isExpanded = expandedVersions.has(version.versionNumber);
            const isSelected = selectedVersions.includes(version.versionNumber);
            const diff = getVersionDiff(version);

            return (
              <div
                key={version.versionNumber}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                } ${compareMode ? 'cursor-pointer' : ''}`}
                onClick={() => compareMode && handleVersionSelect(version.versionNumber)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Version Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <ChangeIcon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          Version {version.versionNumber}
                        </span>
                        {version.isCurrent && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeTypeColor(version.changeType)}`}>
                        {version.changeType}
                      </span>

                      {compareMode && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleVersionSelect(version.versionNumber)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            disabled={!isSelected && selectedVersions.length >= 2}
                          />
                        </div>
                      )}
                    </div>

                    {/* Version Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-medium">
                            {getUserInitials(version.editedBy.name)}
                          </span>
                        </div>
                        <span>{version.editedBy.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{format(new Date(version.editedAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      
                      <span>•</span>
                      
                      <span>{formatDistanceToNow(new Date(version.editedAt), { addSuffix: true })}</span>
                    </div>

                    {/* Changes Summary */}
                    {version.changes && (
                      <p className="text-sm text-gray-700 mb-3">{version.changes}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {version.wordCount && (
                        <span>{version.wordCount} words</span>
                      )}
                      
                      {version.characterCount && (
                        <>
                          <span>•</span>
                          <span>{version.characterCount} characters</span>
                        </>
                      )}
                      
                      {!version.isCurrent && (diff.added > 0 || diff.removed > 0) && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">+{diff.added}</span>
                          <span className="text-red-600">-{diff.removed}</span>
                        </>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && version.content && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Content Preview</h5>
                        <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                          {version.content.substring(0, 500)}
                          {version.content.length > 500 && '...'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVersionExpanded(version.versionNumber);
                      }}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </Button>

                    {!version.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreVersion(version.versionNumber);
                        }}
                        title="Restore this version"
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Version"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to restore version {restoreVersionNumber}? This will create a new version
            with the content from version {restoreVersionNumber}.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> This action will not delete any existing versions. 
              A new version will be created with the restored content.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowRestoreModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmRestore}
            >
              Restore Version
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentVersionHistory;