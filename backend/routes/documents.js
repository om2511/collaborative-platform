const express = require('express');
const {
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
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware for document creation and updates
const documentValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Document title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Document content is required'),
  body('project')
    .isMongoId()
    .withMessage('Valid project ID is required'),
  body('type')
    .optional()
    .isIn(['note', 'specification', 'meeting_minutes', 'guide', 'other'])
    .withMessage('Invalid document type')
];

const documentUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty if provided'),
  body('changeType')
    .optional()
    .isIn(['minor', 'major', 'patch'])
    .withMessage('Invalid change type'),
  body('changes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Change description cannot be more than 500 characters')
];

// Get documents for a project
router.get('/project/:projectId', checkProjectPermission('viewer'), getProjectDocuments);

// Get single document (with optional version history)
router.get('/:id', getDocument);

// Create document
router.post('/', documentValidation, checkProjectPermission('editor'), createDocument);

// Update document content (creates new version)
router.put('/:id', documentUpdateValidation, updateDocument);

// Delete document
router.delete('/:id', deleteDocument);

// Document locking for collaborative editing
router.post('/:id/lock', lockDocument);
router.post('/:id/unlock', unlockDocument);

// Version control routes
router.get('/:id/versions', getDocumentVersions);
router.get('/:id/versions/:versionNumber', getDocumentVersion);
router.post('/:id/versions/:versionNumber/restore', 
  body('changes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Change description cannot be more than 500 characters'),
  restoreDocumentVersion
);
router.get('/:id/versions/:version1/compare/:version2', compareDocumentVersions);

module.exports = router;