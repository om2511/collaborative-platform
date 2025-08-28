const express = require('express');
const {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  updateTaskStatus,
  updateTaskChecklist,
  assignTask,
  getTask,
  getTaskStatusStats,
  bulkUpdateTaskStatus,
  getTaskTimeline
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { taskValidation } = require('../utils/validators');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get tasks for a project
router.get('/project/:projectId', checkProjectPermission('viewer'), getProjectTasks);

// Create task
router.post('/', taskValidation, createTask);

// Update task
router.put('/:id', updateTask);

// Delete task
router.delete('/:id', deleteTask);

// Reorder tasks (for drag and drop)
router.put('/reorder', reorderTasks);

// Get single task
router.get('/:id', getTask);

// Update task status
router.put('/:id/status', updateTaskStatus);

// Update task checklist
router.put('/:id/checklist', updateTaskChecklist);

// Assign task to user
router.put('/:id/assign', assignTask);

// Get task status statistics for project
router.get('/project/:projectId/status-stats', checkProjectPermission('viewer'), getTaskStatusStats);

// Bulk update task status
router.put('/bulk/status', bulkUpdateTaskStatus);

// Get task activity timeline
router.get('/:id/timeline', getTaskTimeline);

module.exports = router;