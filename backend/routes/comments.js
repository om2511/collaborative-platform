const express = require('express');
const {
  getTaskComments,
  getProjectComments,
  createComment,
  updateComment,
  deleteComment,
  addReaction
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot be more than 2000 characters')
];

// Get comments for a task
router.get('/task/:taskId', getTaskComments);

// Get comments for a project  
router.get('/project/:projectId', getProjectComments);

// Create comment
router.post('/', commentValidation, createComment);

// Update comment
router.put('/:id', 
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot be more than 2000 characters'),
  updateComment
);

// Delete comment
router.delete('/:id', deleteComment);

// Add reaction to comment
router.post('/:id/react',
  body('type')
    .optional()
    .isIn(['like', 'love', 'laugh', 'angry', 'sad', 'thumbs_up', 'thumbs_down'])
    .withMessage('Invalid reaction type'),
  addReaction
);

module.exports = router;