const Document = require('../models/Document');
const Project = require('../models/Project');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all documents for a project
// @route   GET /api/documents/project/:projectId
// @access  Private
const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, status, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { project: projectId };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const documents = await Document.find(query)
      .populate('creator', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('lockedBy', 'name email avatar')
      .select('-versions') // Exclude versions for list view
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalDocuments = await Document.countDocuments(query);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: page,
          pages: Math.ceil(totalDocuments / limit),
          total: totalDocuments
        }
      }
    });
  } catch (error) {
    console.error('Get project documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
};

// @desc    Get single document with version history
// @route   GET /api/documents/:id
// @access  Private
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeVersions = false } = req.query;

    let query = Document.findById(id)
      .populate('creator', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('lockedBy', 'name email avatar')
      .populate('project', 'name description');

    if (includeVersions) {
      query = query.populate('versions.editedBy', 'name email avatar');
    } else {
      query = query.select('-versions');
    }

    const document = await query;

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check and release expired locks
    const lockReleased = document.checkLockTimeout();
    if (lockReleased) {
      await document.save();
    }

    res.json({
      success: true,
      data: { document }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: error.message
    });
  }
};

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const documentData = {
      ...req.body,
      creator: req.user._id,
      lastEditedBy: req.user._id
    };

    const document = await Document.create(documentData);
    await document.populate('creator', 'name email avatar');
    await document.populate('lastEditedBy', 'name email avatar');

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${document.project}`).emit('document_created', {
      document,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating document',
      error: error.message
    });
  }
};

// @desc    Update document content (creates new version)
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title, changes, changeType = 'minor', isAutoSave = false } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document is locked by another user
    document.checkLockTimeout();
    if (document.isLocked && document.lockedBy && document.lockedBy.toString() !== req.user._id.toString()) {
      const lockedByUser = await User.findById(document.lockedBy).select('name');
      return res.status(423).json({
        success: false,
        message: `Document is currently being edited by ${lockedByUser?.name || 'another user'}`,
        lockedBy: {
          id: document.lockedBy,
          name: lockedByUser?.name,
          lockedAt: document.lockedAt
        }
      });
    }

    // Store metadata for version tracking
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID || 'unknown'
    };

    // Update document
    const updateData = {
      lastEditedBy: req.user._id,
      ...(title && { title }),
      ...(content && { content })
    };

    // If content changed, prepare version data
    if (content && content !== document.content) {
      // This will trigger the pre-save middleware to create version
      document.content = content;
      document.lastEditedBy = req.user._id;
      
      // Add metadata to the version that will be created
      document.versions.push({
        content: document.content,
        versionNumber: document.currentVersion + 1,
        editedBy: req.user._id,
        editedAt: new Date(),
        changes: changes || 'Document updated',
        changeType,
        isAutoSave,
        metadata
      });
      
      await document.save();
    } else {
      // Just update other fields without creating version
      await Document.findByIdAndUpdate(id, updateData);
    }

    const updatedDocument = await Document.findById(id)
      .populate('creator', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('lockedBy', 'name email avatar');

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${document.project}`).emit('document_updated', {
      document: updatedDocument,
      isAutoSave,
      updatedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: { 
        document: updatedDocument,
        versionCreated: content && content !== document.content
      }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: error.message
    });
  }
};

// @desc    Lock document for editing
// @route   POST /api/documents/:id/lock
// @access  Private
const lockDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document is already locked
    document.checkLockTimeout();
    if (document.isLocked && document.lockedBy.toString() !== req.user._id.toString()) {
      const lockedByUser = await User.findById(document.lockedBy).select('name');
      return res.status(423).json({
        success: false,
        message: `Document is already locked by ${lockedByUser?.name || 'another user'}`,
        lockedBy: {
          id: document.lockedBy,
          name: lockedByUser?.name,
          lockedAt: document.lockedAt
        }
      });
    }

    // Lock the document
    document.isLocked = true;
    document.lockedBy = req.user._id;
    document.lockedAt = new Date();
    await document.save();

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${document.project}`).emit('document_locked', {
      documentId: id,
      lockedBy: {
        id: req.user._id,
        name: req.user.name
      },
      lockedAt: document.lockedAt
    });

    res.json({
      success: true,
      message: 'Document locked successfully',
      data: {
        lockedBy: req.user._id,
        lockedAt: document.lockedAt
      }
    });
  } catch (error) {
    console.error('Lock document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error locking document',
      error: error.message
    });
  }
};

// @desc    Unlock document
// @route   POST /api/documents/:id/unlock
// @access  Private
const unlockDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can unlock (owner or admin)
    if (document.lockedBy && 
        document.lockedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only unlock documents you have locked'
      });
    }

    // Unlock the document
    document.isLocked = false;
    document.lockedBy = undefined;
    document.lockedAt = undefined;
    await document.save();

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${document.project}`).emit('document_unlocked', {
      documentId: id,
      unlockedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Document unlocked successfully'
    });
  } catch (error) {
    console.error('Unlock document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlocking document',
      error: error.message
    });
  }
};

// @desc    Get document version history
// @route   GET /api/documents/:id/versions
// @access  Private
const getDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const document = await Document.findById(id)
      .select('title currentVersion versions')
      .populate('versions.editedBy', 'name email avatar');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Sort versions by version number (descending)
    const sortedVersions = document.versions.sort((a, b) => b.versionNumber - a.versionNumber);
    
    // Paginate versions
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedVersions = sortedVersions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        documentTitle: document.title,
        currentVersion: document.currentVersion,
        versions: paginatedVersions,
        pagination: {
          current: page,
          pages: Math.ceil(document.versions.length / limit),
          total: document.versions.length
        }
      }
    });
  } catch (error) {
    console.error('Get document versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document versions',
      error: error.message
    });
  }
};

// @desc    Get specific document version
// @route   GET /api/documents/:id/versions/:versionNumber
// @access  Private
const getDocumentVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    const document = await Document.findById(id)
      .populate('versions.editedBy', 'name email avatar');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const version = document.versions.find(v => v.versionNumber === parseInt(versionNumber));
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      data: {
        documentTitle: document.title,
        version
      }
    });
  } catch (error) {
    console.error('Get document version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document version',
      error: error.message
    });
  }
};

// @desc    Restore document to specific version
// @route   POST /api/documents/:id/versions/:versionNumber/restore
// @access  Private
const restoreDocumentVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const { changes } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document is locked
    document.checkLockTimeout();
    if (document.isLocked && document.lockedBy.toString() !== req.user._id.toString()) {
      return res.status(423).json({
        success: false,
        message: 'Document is currently locked by another user'
      });
    }

    const targetVersion = document.versions.find(v => v.versionNumber === parseInt(versionNumber));
    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Store current content as new version before restoring
    const currentContent = document.content;
    document.content = targetVersion.content;
    document.lastEditedBy = req.user._id;

    // Add restore information to version
    document.versions.push({
      content: currentContent,
      versionNumber: document.currentVersion + 1,
      editedBy: req.user._id,
      editedAt: new Date(),
      changes: changes || `Restored to version ${versionNumber}`,
      changeType: 'major',
      isAutoSave: false,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        restoredFromVersion: parseInt(versionNumber)
      }
    });

    await document.save();

    const updatedDocument = await Document.findById(id)
      .populate('creator', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${document.project}`).emit('document_version_restored', {
      document: updatedDocument,
      restoredToVersion: parseInt(versionNumber),
      restoredBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: `Document restored to version ${versionNumber}`,
      data: { 
        document: updatedDocument,
        restoredToVersion: parseInt(versionNumber)
      }
    });
  } catch (error) {
    console.error('Restore document version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring document version',
      error: error.message
    });
  }
};

// @desc    Compare two document versions
// @route   GET /api/documents/:id/versions/:version1/compare/:version2
// @access  Private
const compareDocumentVersions = async (req, res) => {
  try {
    const { id, version1, version2 } = req.params;

    const document = await Document.findById(id)
      .populate('versions.editedBy', 'name email avatar');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const v1 = document.versions.find(v => v.versionNumber === parseInt(version1));
    const v2 = document.versions.find(v => v.versionNumber === parseInt(version2));

    if (!v1 || !v2) {
      return res.status(404).json({
        success: false,
        message: 'One or both versions not found'
      });
    }

    // Create diff between versions
    const diff = document.createDiff(v1.content, v2.content);

    res.json({
      success: true,
      data: {
        documentTitle: document.title,
        comparison: {
          version1: {
            number: v1.versionNumber,
            content: v1.content,
            editedBy: v1.editedBy,
            editedAt: v1.editedAt
          },
          version2: {
            number: v2.versionNumber,
            content: v2.content,
            editedBy: v2.editedBy,
            editedAt: v2.editedAt
          },
          diff
        }
      }
    });
  } catch (error) {
    console.error('Compare document versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing document versions',
      error: error.message
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions (creator or admin)
    if (document.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    await Document.findByIdAndDelete(id);

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${document.project}`).emit('document_deleted', {
      documentId: id,
      deletedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
};

module.exports = {
  getProjectDocuments,
  getDocument,
  createDocument,
  updateDocument,
  lockDocument,
  unlockDocument,
  getDocumentVersions,
  getDocumentVersion,
  restoreDocumentVersion,
  compareDocumentVersions,
  deleteDocument
};