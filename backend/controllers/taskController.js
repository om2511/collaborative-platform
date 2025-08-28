const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get project tasks
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assignee, priority, category } = req.query;

    // Build query
    const query = { project: projectId };
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('watchers', 'name email avatar')
      .sort({ position: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      creator: req.user._id
    };

    // Set position for new task
    if (!taskData.position) {
      const lastTask = await Task.findOne({ 
        project: taskData.project, 
        status: taskData.status || 'todo' 
      }).sort({ position: -1 });
      
      taskData.position = lastTask ? lastTask.position + 1 : 0;
    }

    const task = await Task.create(taskData);
    await task.populate('assignee', 'name email avatar');
    await task.populate('creator', 'name email avatar');

    // Update project progress
    await updateProjectProgress(taskData.project);

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_created', {
      projectId: task.project,
      task,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Track status change for progress calculation
    const oldStatus = task.status;
    const newStatus = updates.status;

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignee', 'name email avatar')
     .populate('creator', 'name email avatar');

    // Update project progress if status changed
    if (oldStatus !== newStatus) {
      await updateProjectProgress(task.project);
    }

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_updated', {
      task: updatedTask,
      changes: updates,
      updatedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(id);

    // Update project progress
    await updateProjectProgress(task.project);

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_deleted', {
      taskId: id,
      deletedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// @desc    Reorder tasks (for drag and drop)
// @route   PUT /api/tasks/reorder
// @access  Private
const reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, status, position }

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Tasks array is required'
      });
    }

    // Update all tasks in bulk
    const bulkOps = tasks.map(({ id, status, position }) => ({
      updateOne: {
        filter: { _id: id },
        update: { status, position }
      }
    }));

    await Task.bulkWrite(bulkOps);

    // Get project ID from first task
    const firstTask = await Task.findById(tasks[0].id);
    if (firstTask) {
      await updateProjectProgress(firstTask.project);

      // Emit to project room
      const io = req.app.get('socketio');
      io.to(`project_${firstTask.project}`).emit('tasks_reordered', {
        tasks,
        reorderedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Tasks reordered successfully'
    });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering tasks',
      error: error.message
    });
  }
};

// Helper function to update project progress
const updateProjectProgress = async (projectId) => {
  try {
    const tasks = await Task.find({ project: projectId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldStatus = task.status;
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'done' && { actualHours: req.body.actualHours || task.actualHours })
      },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email avatar')
     .populate('creator', 'name email avatar');

    // Update project progress
    await updateProjectProgress(task.project);

    // Create status change activity log if needed
    const statusChangeData = {
      taskId: id,
      oldStatus,
      newStatus: status,
      changedBy: req.user._id,
      comment: comment || `Status changed from ${oldStatus} to ${status}`,
      timestamp: new Date()
    };

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_status_updated', {
      task: updatedTask,
      statusChange: statusChangeData,
      updatedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: { 
        task: updatedTask,
        statusChange: statusChangeData
      }
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message
    });
  }
};

// @desc    Add task to checklist item
// @route   PUT /api/tasks/:id/checklist
// @access  Private
const updateTaskChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      { checklist },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email avatar')
     .populate('creator', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_checklist_updated', {
      task,
      updatedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task checklist updated',
      data: { task }
    });
  } catch (error) {
    console.error('Update task checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task checklist',
      error: error.message
    });
  }
};

// @desc    Assign task to user
// @route   PUT /api/tasks/:id/assign
// @access  Private  
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId, comment } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      { assignee: assigneeId },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email avatar')
     .populate('creator', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_assigned', {
      task,
      comment: comment || `Task assigned to ${task.assignee?.name}`,
      assignedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning task',
      error: error.message
    });
  }
};

// @desc    Get single task with details
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('watchers', 'name email avatar')
      .populate('project', 'name description');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

// @desc    Get task status statistics for project
// @route   GET /api/tasks/project/:projectId/status-stats
// @access  Private
const getTaskStatusStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    const stats = await Task.aggregate([
      { $match: { project: new require('mongoose').Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          tasks: { $push: { _id: '$_id', title: '$title', priority: '$priority' } }
        }
      }
    ]);

    // Format the stats
    const statusStats = {
      todo: { count: 0, tasks: [] },
      in_progress: { count: 0, tasks: [] },
      review: { count: 0, tasks: [] },
      done: { count: 0, tasks: [] }
    };

    stats.forEach(stat => {
      if (statusStats[stat._id]) {
        statusStats[stat._id] = {
          count: stat.count,
          tasks: stat.tasks
        };
      }
    });

    const totalTasks = Object.values(statusStats).reduce((sum, status) => sum + status.count, 0);
    const completionRate = totalTasks > 0 ? (statusStats.done.count / totalTasks * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        statusStats,
        totalTasks,
        completionRate
      }
    });
  } catch (error) {
    console.error('Get task status stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics',
      error: error.message
    });
  }
};

// @desc    Bulk update task status
// @route   PUT /api/tasks/bulk/status
// @access  Private
const bulkUpdateTaskStatus = async (req, res) => {
  try {
    const { taskIds, status, projectId } = req.body;

    if (!Array.isArray(taskIds) || !status) {
      return res.status(400).json({
        success: false,
        message: 'Task IDs array and status are required'
      });
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { 
        status,
        updatedAt: new Date(),
        lastEditedBy: req.user._id
      }
    );

    // Update project progress
    if (projectId) {
      await updateProjectProgress(projectId);
    }

    // Emit to project room
    const io = req.app.get('socketio');
    if (projectId) {
      io.to(`project_${projectId}`).emit('tasks_bulk_updated', {
        taskIds,
        status,
        updatedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} tasks updated successfully`,
      data: { 
        modifiedCount: result.modifiedCount,
        taskIds,
        status
      }
    });
  } catch (error) {
    console.error('Bulk update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tasks',
      error: error.message
    });
  }
};

// @desc    Get task activity timeline
// @route   GET /api/tasks/:id/timeline
// @access  Private
const getTaskTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get task activity/timeline - this would normally be from an activity log
    // For now, we'll create a basic timeline from task data
    const timeline = [
      {
        id: 1,
        type: 'created',
        user: task.creator,
        timestamp: task.createdAt,
        description: 'Task created'
      }
    ];

    if (task.assignee && task.assignee._id.toString() !== task.creator._id.toString()) {
      timeline.push({
        id: 2,
        type: 'assigned',
        user: task.creator,
        assignedTo: task.assignee,
        timestamp: task.createdAt,
        description: `Assigned to ${task.assignee.name}`
      });
    }

    if (task.lastEditedBy && task.lastEditedBy._id.toString() !== task.creator._id.toString()) {
      timeline.push({
        id: 3,
        type: 'updated',
        user: task.lastEditedBy,
        timestamp: task.updatedAt,
        description: 'Task updated'
      });
    }

    res.json({
      success: true,
      data: {
        task,
        timeline: timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    });
  } catch (error) {
    console.error('Get task timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task timeline',
      error: error.message
    });
  }
};

module.exports = {
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
};