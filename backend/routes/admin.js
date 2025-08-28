const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSystemAnalytics,
  getSystemLogs
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { body, param } = require('express-validator');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(requireRole('admin'));

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:id', 
  param('id').isMongoId().withMessage('Invalid user ID'),
  getUserById
);

router.patch('/users/:id/status',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('reason').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Reason must be between 1 and 500 characters'),
  updateUserStatus
);

router.patch('/users/:id/role',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['user', 'admin', 'manager']).withMessage('Invalid role'),
  updateUserRole
);

router.delete('/users/:id',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('transferProjectsTo').optional().isMongoId().withMessage('Invalid target user ID for project transfer'),
  deleteUser
);

// System Analytics Routes
router.get('/analytics', getSystemAnalytics);
router.get('/logs', getSystemLogs);

module.exports = router;