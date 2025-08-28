const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const {
  getProjectMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  clearProjectMessages
} = require('../controllers/chatController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get chat messages for a project
router.get('/project/:projectId', checkProjectPermission('viewer'), getProjectMessages);

// Send message
router.post('/', [
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 2000 })
    .withMessage('Message cannot be more than 2000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'file', 'image', 'system'])
    .withMessage('Invalid message type')
], sendMessage);

// Edit message
router.put('/message/:messageId', [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 2000 })
    .withMessage('Message cannot be more than 2000 characters')
], editMessage);

// Delete message
router.delete('/message/:messageId', deleteMessage);

// Clear all messages for a project
router.delete('/project/:projectId/clear', checkProjectPermission('member'), clearProjectMessages);

module.exports = router;