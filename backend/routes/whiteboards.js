const express = require('express');
const {
  getProjectWhiteboards,
  getWhiteboard,
  createWhiteboard,
  updateWhiteboard,
  addObject,
  updateObject,
  deleteObject,
  updateCursor,
  clearWhiteboard
} = require('../controllers/whiteboardController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { body } = require('express-validator');

// Middleware to check project permission for whiteboard operations
const checkWhiteboardProjectPermission = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const whiteboardId = req.params.id;
      const Whiteboard = require('../models/Whiteboard');
      
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard) {
        return res.status(404).json({
          success: false,
          message: 'Whiteboard not found'
        });
      }
      
      // Set the projectId in params for the checkProjectPermission middleware
      req.params.projectId = whiteboard.project.toString();
      next();
    } catch (error) {
      console.error('Whiteboard project permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking whiteboard permissions'
      });
    }
  };
};

const router = express.Router();

// All routes are protected
router.use(protect);

// Test route to verify basic functionality
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Whiteboard routes working', user: req.user?.name });
});

// Validation middleware
const createWhiteboardValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
];

// Project-based routes with proper RBAC
// Get whiteboards for a project
router.get('/projects/:projectId', checkProjectPermission('viewer'), getProjectWhiteboards);

// Create whiteboard for a project - allow viewers (including guests) to create whiteboards in public projects
router.post('/projects/:projectId', checkProjectPermission('viewer'), createWhiteboardValidation, createWhiteboard);

// Individual whiteboard routes with project permission checking
// Get single whiteboard
router.get('/:id', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), getWhiteboard);

// Update whiteboard
router.put('/:id', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), updateWhiteboard);

// Add object to whiteboard
router.post('/:id/objects', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), addObject);

// Clear all objects from whiteboard - team members only, guests cannot clear
router.delete('/:id/objects', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), clearWhiteboard);

// Update object in whiteboard
router.put('/:id/objects/:objectId', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), updateObject);

// Delete object from whiteboard
router.delete('/:id/objects/:objectId', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), deleteObject);

// Update cursor position
router.put('/:id/cursor', checkWhiteboardProjectPermission(), checkProjectPermission('viewer'), updateCursor);

module.exports = router;