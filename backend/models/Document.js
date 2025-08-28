const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['note', 'specification', 'meeting_minutes', 'guide', 'other'],
    default: 'note'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  versions: [{
    content: String,
    versionNumber: Number,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String, // Summary of changes
    changeType: {
      type: String,
      enum: ['minor', 'major', 'patch'],
      default: 'minor'
    },
    wordCount: Number,
    characterCount: Number,
    diff: {
      added: [String], // Added text sections
      removed: [String], // Removed text sections
      modified: [String] // Modified text sections
    },
    isAutoSave: {
      type: Boolean,
      default: false
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      sessionId: String
    }
  }],
  permissions: {
    canView: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    canEdit: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    canComment: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  // Collaboration features
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: Date,
  lockTimeout: {
    type: Number,
    default: 300000 // 5 minutes in milliseconds
  },
  // Auto-save configuration
  autoSaveEnabled: {
    type: Boolean,
    default: true
  },
  autoSaveInterval: {
    type: Number,
    default: 30000 // 30 seconds
  },
  // Document statistics
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0 // in minutes
  }
}, {
  timestamps: true
});

// Add indexes for performance
DocumentSchema.index({ project: 1, createdAt: -1 });
DocumentSchema.index({ creator: 1 });
DocumentSchema.index({ 'versions.versionNumber': 1 });
DocumentSchema.index({ lastEditedBy: 1 });

// Virtual for latest version
DocumentSchema.virtual('latestVersion').get(function() {
  return this.versions.length > 0 ? this.versions[this.versions.length - 1] : null;
});

// Helper method to calculate word and character counts
DocumentSchema.methods.calculateStats = function() {
  if (this.content) {
    this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    this.characterCount = this.content.length;
    this.readingTime = Math.ceil(this.wordCount / 200); // Assuming 200 words per minute
  }
};

// Helper method to create version diff
DocumentSchema.methods.createDiff = function(oldContent, newContent) {
  // Simple diff implementation - can be enhanced with libraries like diff
  const oldWords = oldContent ? oldContent.split(/\s+/) : [];
  const newWords = newContent ? newContent.split(/\s+/) : [];
  
  const added = [];
  const removed = [];
  
  // Basic word-level diff
  newWords.forEach(word => {
    if (!oldWords.includes(word)) {
      added.push(word);
    }
  });
  
  oldWords.forEach(word => {
    if (!newWords.includes(word)) {
      removed.push(word);
    }
  });
  
  return { added, removed, modified: [] };
};

// Auto-increment version number and create version history
DocumentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    const oldContent = this.isNew ? '' : this.versions.length > 0 ? this.versions[this.versions.length - 1].content : '';
    
    this.currentVersion += 1;
    this.calculateStats();
    
    const diff = this.createDiff(oldContent, this.content);
    
    this.versions.push({
      content: oldContent, // Store the previous content
      versionNumber: this.currentVersion - 1,
      editedBy: this.lastEditedBy,
      editedAt: new Date(),
      wordCount: oldContent ? oldContent.split(/\s+/).filter(word => word.length > 0).length : 0,
      characterCount: oldContent ? oldContent.length : 0,
      diff: diff
    });
  } else if (this.isNew) {
    this.calculateStats();
  }
  next();
});

// Auto-release lock after timeout
DocumentSchema.methods.checkLockTimeout = function() {
  if (this.isLocked && this.lockedAt) {
    const timeElapsed = Date.now() - this.lockedAt.getTime();
    if (timeElapsed > this.lockTimeout) {
      this.isLocked = false;
      this.lockedBy = undefined;
      this.lockedAt = undefined;
      return true; // Lock was released
    }
  }
  return false;
};

module.exports = mongoose.model('Document', DocumentSchema);