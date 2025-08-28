const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Idea = require('../models/Idea');
const Document = require('../models/Document');
const { validationResult } = require('express-validator');

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', role = 'all', sort = '-createdAt' } = req.query;
    
    // Build query
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status
    if (status !== 'all') {
      query.isActive = status === 'active';
    }
    
    // Filter by role
    if (role !== 'all') {
      query.role = role;
    }
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get user statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [projectCount, taskCount, ideaCount] = await Promise.all([
          Project.countDocuments({ 'team.user': user._id }),
          Task.countDocuments({ assignee: user._id }),
          Idea.countDocuments({ createdBy: user._id })
        ]);
        
        return {
          ...user.toObject(),
          stats: {
            projects: projectCount,
            tasks: taskCount,
            ideas: ideaCount
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID with detailed stats
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get detailed user statistics
    const [projects, recentTasks, recentIdeas, taskStats] = await Promise.all([
      Project.find({ 'team.user': user._id })
        .select('name description status progress createdAt')
        .limit(10),
      Task.find({ assignee: user._id })
        .populate('project', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
      Idea.find({ createdBy: user._id })
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Task.aggregate([
        { $match: { assignee: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        user,
        stats: {
          projects: projects.length,
          tasks: recentTasks.length,
          ideas: recentIdeas.length,
          tasksByStatus: taskStats
        },
        recentActivity: {
          projects,
          tasks: recentTasks,
          ideas: recentIdeas
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }
    
    user.isActive = isActive;
    user.lastModifiedBy = req.user._id;
    user.statusChangeReason = reason;
    user.statusChangedAt = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['user', 'admin', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from changing their own role
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }
    
    const oldRole = user.role;
    user.role = role;
    user.lastModifiedBy = req.user._id;
    user.roleChangedAt = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { transferProjectsTo } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // If transferring projects, validate the target user
    if (transferProjectsTo) {
      const targetUser = await User.findById(transferProjectsTo);
      if (!targetUser) {
        return res.status(400).json({
          success: false,
          message: 'Target user for project transfer not found'
        });
      }
      
      // Transfer project ownership
      await Project.updateMany(
        { owner: id },
        { owner: transferProjectsTo }
      );
    }
    
    // Soft delete: mark as deleted instead of removing
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    user.isActive = false;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { deletedUserId: id, transferredTo: transferProjectsTo }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get system analytics for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getSystemAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get system-wide statistics
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalIdeas,
      newUsersThisMonth,
      newProjectsThisMonth,
      usersByRole,
      projectsByStatus,
      tasksByStatus
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
      Idea.countDocuments(),
      User.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo },
        isDeleted: { $ne: true }
      }),
      Project.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    
    // Calculate growth rates
    const userGrowthRate = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(2) : 0;
    const projectGrowthRate = totalProjects > 0 ? ((newProjectsThisMonth / totalProjects) * 100).toFixed(2) : 0;
    const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    
    // Get recent activity
    const recentActivity = await User.find({ 
      createdAt: { $gte: thirtyDaysAgo },
      isDeleted: { $ne: true }
    })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalProjects,
          activeProjects,
          totalTasks,
          completedTasks,
          totalIdeas,
          userGrowthRate: parseFloat(userGrowthRate),
          projectGrowthRate: parseFloat(projectGrowthRate),
          taskCompletionRate: parseFloat(taskCompletionRate)
        },
        distributions: {
          usersByRole,
          projectsByStatus,
          tasksByStatus
        },
        growth: {
          newUsersThisMonth,
          newProjectsThisMonth
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system analytics',
      error: error.message
    });
  }
};

// @desc    Get system logs (basic activity log)
// @route   GET /api/admin/logs
// @access  Private (Admin only)
const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'all' } = req.query;
    
    // For this basic implementation, we'll get recent user activities
    let query = { isDeleted: { $ne: true } };
    
    const recentUsers = await User.find(query)
      .select('name email lastLogin createdAt updatedAt isActive role')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    // Transform to log format
    const logs = recentUsers.map(user => ({
      id: user._id,
      type: 'user_activity',
      action: user.lastLogin ? 'login' : 'registered',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      details: {
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      timestamp: user.lastLogin || user.createdAt
    }));
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system logs',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSystemAnalytics,
  getSystemLogs
};