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
    <div className="h-full flex flex-col relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full -translate-y-8 translate-x-8 -z-10"></div>
      
      {/* Header */}
      <div className="p-6 border-b border-white/30 bg-white/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-100/50 to-transparent rounded-full -translate-y-8 -translate-x-8"></div>
        
        <div className="flex items-center justify-between mb-6 relative">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/25">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{document.title}</h3>
            </div>
            <p className="text-sm text-gray-600 font-medium">
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
              className={compareMode ? 
                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200' :
                'bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200'
              }
            >
              {compareMode ? 'Exit Compare' : 'Compare Versions'}
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              icon={PencilIcon}
              iconPosition='left'
              onClick={() => onSelectDocument(document)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
            >
              Edit Document
            </Button>
          </div>
        </div>

        {compareMode && (
          <div className="bg-blue-100/70 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-200/50 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
            <p className="text-sm text-blue-800 font-medium relative">
              Select up to 2 versions to compare. 
              {selectedVersions.length === 2 && (
                <span className="ml-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg shadow-blue-500/25"
                  >
                    Compare Selected
                  </Button>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {allVersions.map((version) => {
            const ChangeIcon = getChangeTypeIcon(version.changeType);
            const isExpanded = expandedVersions.has(version.versionNumber);
            const isSelected = selectedVersions.includes(version.versionNumber);
            const diff = getVersionDiff(version);

            return (
              <div
                key={version.versionNumber}
                className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl hover:bg-white/80 transition-all duration-300 group relative overflow-hidden ${
                  isSelected ? 'ring-2 ring-blue-500/50 bg-blue-50/80' : ''
                } ${compareMode ? 'cursor-pointer' : ''}`}
                onClick={() => compareMode && handleVersionSelect(version.versionNumber)}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full -translate-y-5 translate-x-5 group-hover:scale-110 transition-transform duration-300"></div>
                
                <div className="flex items-start justify-between relative">
                  <div className="flex-1">
                    {/* Version Header */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/25">
                          <ChangeIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          Version {version.versionNumber}
                        </span>
                        {version.isCurrent && (
                          <span className="bg-green-100/80 backdrop-blur-sm text-green-800 text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 shadow-sm">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 shadow-sm ${getChangeTypeColor(version.changeType)}`}>
                        {version.changeType}
                      </span>

                      {compareMode && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleVersionSelect(version.versionNumber)}
                            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            disabled={!isSelected && selectedVersions.length >= 2}
                          />
                        </div>
                      )}
                    </div>

                    {/* Version Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3 shadow-lg">
                          <span className="text-white text-xs font-bold">
                            {getUserInitials(version.editedBy.name)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-700">{version.editedBy.name}</span>
                      </div>
                      
                      <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                        <CalendarIcon className="h-4 w-4 mr-2 text-green-600" />
                        <span className="font-medium text-gray-700">{format(new Date(version.editedAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      
                      <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                        <ClockIcon className="h-4 w-4 mr-2 text-green-600" />
                        <span className="font-medium text-gray-700">{formatDistanceToNow(new Date(version.editedAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Changes Summary */}
                    {version.changes && (
                      <div className="mb-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                        <p className="text-sm text-gray-700 font-medium">{version.changes}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {version.wordCount && (
                        <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <span className="font-medium text-gray-700">{version.wordCount} words</span>
                        </div>
                      )}
                      
                      {version.characterCount && (
                        <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <span className="font-medium text-gray-700">{version.characterCount} characters</span>
                        </div>
                      )}
                      
                      {!version.isCurrent && (diff.added > 0 || diff.removed > 0) && (
                        <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30 shadow-sm">
                          <span className="text-green-600 font-bold">+{diff.added}</span>
                          <span className="text-red-600 font-bold">-{diff.removed}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && version.content && (
                      <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <EyeIcon className="h-4 w-4 mr-2 text-green-600" />
                          Content Preview
                        </h5>
                        <div className="text-sm text-gray-700 max-h-40 overflow-y-auto leading-relaxed p-3 bg-white/70 rounded-lg border border-white/30">
                          {version.content.substring(0, 500)}
                          {version.content.length > 500 && '...'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVersionExpanded(version.versionNumber);
                      }}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                      className="bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
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
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200"
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