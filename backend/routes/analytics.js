const express = require('express');
const {
  getProjectAnalytics,
  getTeamAnalytics,
  getCurrentUserTeamAnalytics,
  getDashboardAnalytics,
  getRecentActivity
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { param, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// All routes are protected
router.use(protect);

// Analytics routes with validation
router.get('/dashboard', getDashboardAnalytics);
router.get('/activity', getRecentActivity);

router.get('/projects/:projectId', [
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  handleValidationErrors
], getProjectAnalytics);

// Add route for current user's team analytics (must come before parameterized route)
router.get('/team/current', getCurrentUserTeamAnalytics);

router.get('/team/:teamId', [
  param('teamId').isMongoId().withMessage('Invalid team ID'),
  handleValidationErrors
], getTeamAnalytics);

// Legacy route compatibility
router.get('/project/:projectId', [
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  handleValidationErrors,
  checkProjectPermission('viewer')
], getProjectAnalytics);

module.exports = router;