const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Document = require('../models/Document');

// Try to import Idea model, it might not exist
let Idea;
try {
  Idea = require('../models/Idea');
} catch (err) {
  console.warn('Idea model not found, skipping idea-related analytics');
}
const { validationResult } = require('express-validator');

// Helper function to sanitize numeric values
const sanitizeNumericValue = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return Number(value);
};

// Helper function to sanitize team performance data
const sanitizeTeamPerformance = (teamPerformance) => {
  return teamPerformance.map(member => ({
    ...member,
    completedTasks: sanitizeNumericValue(member.completedTasks),
    totalTasks: sanitizeNumericValue(member.totalTasks),
    avgCompletionTime: sanitizeNumericValue(member.avgCompletionTime)
  }));
};

// @desc    Get project analytics overview
// @route   GET /api/analytics/projects/:projectId
// @access  Private (Project Members)
const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is part of the project
    const isTeamMember = project.team.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    if (!isTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          tasks: { $push: { _id: '$_id', title: '$title', priority: '$priority', assignee: '$assignee' } }
        }
      }
    ]);

    // Get priority distribution
    const priorityStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get team productivity stats
    const teamStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$assignee',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Task.find({
      project: projectId,
      updatedAt: { $gte: thirtyDaysAgo }
    })
    .populate('assignee', 'name email')
    .populate('lastEditedBy', 'name email')
    .sort({ updatedAt: -1 })
    .limit(20);

    // Get ideas statistics if Idea model exists
    let ideaStats = [{ totalIdeas: 0, averageRating: 0, totalVotes: 0 }];
    if (Idea) {
      try {
        ideaStats = await Idea.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: null,
              totalIdeas: { $sum: 1 },
              averageRating: { $avg: '$rating' },
              totalVotes: { $sum: '$votes' }
            }
          }
        ]);
        if (ideaStats.length === 0) {
          ideaStats = [{ totalIdeas: 0, averageRating: 0, totalVotes: 0 }];
        }
      } catch (error) {
        console.warn('Error fetching idea stats:', error.message);
      }
    }

    // Get document statistics
    const documentStats = await Document.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate completion rate
    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = await Task.countDocuments({ project: projectId, status: 'done' });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // AI-driven insights
    const insights = generateProjectInsights({
      taskStats,
      teamStats,
      completionRate,
      totalTasks,
      recentActivity: recentActivity.length
    });

    res.json({
      success: true,
      data: {
        projectInfo: {
          id: project._id,
          name: project.title,
          description: project.description,
          progress: project.progress,
          createdAt: project.createdAt
        },
        taskStats: {
          byStatus: taskStats,
          byPriority: priorityStats,
          totalTasks,
          completedTasks,
          completionRate
        },
        teamStats,
        ideaStats: ideaStats[0] || { totalIdeas: 0, averageRating: 0, totalVotes: 0 },
        documentStats,
        recentActivity,
        insights
      }
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project analytics',
      error: error.message
    });
  }
};

// @desc    Get current user's team analytics overview
// @route   GET /api/analytics/team/current
// @access  Private
const getCurrentUserTeamAnalytics = async (req, res) => {
  try {
    // Get all projects where user is a team member or owner
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'team.user': req.user._id }
      ]
    }).populate('team.user', 'name email avatar');

    // Get team performance across all projects
    const teamPerformance = await Task.aggregate([
      { 
        $match: { 
          project: { $in: userProjects.map(p => p._id) },
          assignee: { $ne: null } // Filter out tasks without assignees
        } 
      },
      {
        $group: {
          _id: '$assignee',
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          totalTasks: { $sum: 1 },
          avgCompletionTime: { 
            $avg: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'done'] },
                    { $ne: ['$updatedAt', null] },
                    { $ne: ['$createdAt', null] }
                  ]
                },
                { $subtract: ['$updatedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      }
    ]);

    // Get project statistics
    const projectStats = userProjects.map(project => ({
      id: project._id,
      name: project.title,
      progress: project.progress,
      teamSize: project.team.length,
      status: project.status
    }));

    // Sanitize team performance data
    const sanitizedTeamPerformance = sanitizeTeamPerformance(teamPerformance);

    res.json({
      success: true,
      data: {
        teamPerformance: sanitizedTeamPerformance,
        projectStats,
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Get current user team analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team analytics',
      error: error.message
    });
  }
};

// @desc    Get team analytics overview
// @route   GET /api/analytics/team/:teamId
// @access  Private (Team Members)
const getTeamAnalytics = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get all projects where user is a team member or owner
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'team.user': req.user._id }
      ]
    }).populate('team.user', 'name email avatar');

    // Get team performance across all projects
    const teamPerformance = await Task.aggregate([
      { 
        $match: { 
          project: { $in: userProjects.map(p => p._id) },
          assignee: { $ne: null } // Filter out tasks without assignees
        } 
      },
      {
        $group: {
          _id: '$assignee',
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          totalTasks: { $sum: 1 },
          avgCompletionTime: { 
            $avg: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'done'] },
                    { $ne: ['$updatedAt', null] },
                    { $ne: ['$createdAt', null] }
                  ]
                },
                { $subtract: ['$updatedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      }
    ]);

    // Get project statistics
    const projectStats = userProjects.map(project => ({
      id: project._id,
      name: project.title,
      progress: project.progress,
      teamSize: project.team.length,
      status: project.status
    }));

    // Sanitize team performance data
    const sanitizedTeamPerformance = sanitizeTeamPerformance(teamPerformance);

    res.json({
      success: true,
      data: {
        teamPerformance: sanitizedTeamPerformance,
        projectStats,
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team analytics',
      error: error.message
    });
  }
};

// @desc    Get dashboard overview
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's projects (both owned and team member)
    const userProjects = await Project.find({
      $or: [
        { owner: userId },
        { 'team.user': userId }
      ]
    });

    const projectIds = userProjects.map(p => p._id);

    // Get task statistics for user
    const userTaskStats = await Task.aggregate([
      { $match: { assignee: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent tasks assigned to user
    const recentTasks = await Task.find({
      assignee: userId
    })
    .populate('project', 'name')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Get user's recent ideas if Idea model exists
    let recentIdeas = [];
    if (Idea) {
      try {
        recentIdeas = await Idea.find({
          createdBy: userId
        })
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5);
      } catch (error) {
        console.warn('Error fetching recent ideas:', error.message);
      }
    }

    // Get upcoming deadlines
    const upcomingDeadlines = await Task.find({
      assignee: userId,
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('project', 'name')
    .sort({ dueDate: 1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        userTaskStats,
        recentTasks,
        recentIdeas,
        upcomingDeadlines,
        projectCount: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
};

// @desc    Get recent activity across user's projects
// @route   GET /api/analytics/activity
// @access  Private
const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    

    // Get user's projects
    const userProjects = await Project.find({
      'team.user': userId
    }).select('_id title');

    const projectIds = userProjects.map(p => p._id);

    // Get recent activities from various sources
    const activities = [];

    // Recent project updates
    const recentProjects = await Project.find({
      _id: { $in: projectIds },
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
    .populate('owner', 'name')
    .sort({ updatedAt: -1 })
    .limit(5);

    recentProjects.forEach(project => {
      activities.push({
        _id: `project_${project._id}`,
        type: 'project_updated',
        message: `Project "${project.title}" was updated`,
        user: project.owner,
        createdAt: project.updatedAt,
        project: {
          _id: project._id,
          title: project.title
        }
      });
    });

    // Recent task activities
    const recentTasks = await Task.find({
      project: { $in: projectIds },
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
    .populate('assignee', 'name')
    .populate('project', 'title')
    .sort({ updatedAt: -1 })
    .limit(8);

    recentTasks.forEach(task => {
      let message;
      switch(task.status) {
        case 'done':
          message = `Task "${task.title}" was completed`;
          break;
        case 'in_progress':
          message = `Task "${task.title}" is in progress`;
          break;
        case 'review':
          message = `Task "${task.title}" is under review`;
          break;
        default:
          message = `Task "${task.title}" was updated`;
      }

      activities.push({
        _id: `task_${task._id}`,
        type: task.status === 'done' ? 'task_completed' : 'task_updated',
        message,
        user: task.assignee,
        createdAt: task.updatedAt,
        project: task.project,
        task: {
          _id: task._id,
          title: task.title,
          status: task.status
        }
      });
    });

    // Recent ideas if Idea model is available
    if (Idea) {
      try {
        const recentIdeas = await Idea.find({
          project: { $in: projectIds },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .populate('createdBy', 'name')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .limit(3);

        recentIdeas.forEach(idea => {
          activities.push({
            _id: `idea_${idea._id}`,
            type: 'idea_created',
            message: `New idea "${idea.title}" was submitted`,
            user: idea.createdBy,
            createdAt: idea.createdAt,
            project: idea.project
          });
        });
      } catch (error) {
        console.warn('Error fetching ideas for activity:', error.message);
      }
    }

    // Sort all activities by date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    

    res.json({
      success: true,
      data: {
        activities: sortedActivities,
        total: sortedActivities.length
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
};

// Helper function to generate AI-driven insights
const generateProjectInsights = (data) => {
  const insights = [];

  // Completion rate insights
  if (data.completionRate < 30) {
    insights.push({
      type: 'warning',
      category: 'completion',
      title: 'Low Task Completion Rate',
      message: `Only ${data.completionRate}% of tasks are completed. Consider reviewing task assignments and deadlines.`,
      priority: 'high'
    });
  } else if (data.completionRate > 80) {
    insights.push({
      type: 'success',
      category: 'completion',
      title: 'Excellent Progress',
      message: `Great job! ${data.completionRate}% completion rate shows strong project momentum.`,
      priority: 'low'
    });
  }

  // Team productivity insights
  const activeMembers = data.teamStats.filter(member => member.total > 0);
  if (activeMembers.length < data.teamStats.length) {
    insights.push({
      type: 'info',
      category: 'team',
      title: 'Team Engagement',
      message: `${data.teamStats.length - activeMembers.length} team members have no assigned tasks. Consider balancing workload.`,
      priority: 'medium'
    });
  }

  // Activity insights
  if (data.recentActivity < 5) {
    insights.push({
      type: 'warning',
      category: 'activity',
      title: 'Low Recent Activity',
      message: 'Project activity has been low recently. Consider scheduling a team check-in.',
      priority: 'medium'
    });
  }

  // Task load insights
  if (data.totalTasks > 50) {
    insights.push({
      type: 'info',
      category: 'planning',
      title: 'Large Project Scope',
      message: 'This is a large project with many tasks. Consider breaking it into smaller milestones.',
      priority: 'medium'
    });
  }

  return insights;
};

module.exports = {
  getProjectAnalytics,
  getTeamAnalytics,
  getCurrentUserTeamAnalytics,
  getDashboardAnalytics,
  getRecentActivity
};