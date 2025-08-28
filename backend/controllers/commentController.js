const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ 
      task: taskId, 
      parentComment: null // Only top-level comments
    })
      .populate('author', 'name email avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'name email avatar'
        }
      })
      .populate('mentions.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalComments = await Comment.countDocuments({ 
      task: taskId, 
      parentComment: null 
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: page,
          pages: Math.ceil(totalComments / limit),
          total: totalComments
        }
      }
    });
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

// @desc    Get comments for a project
// @route   GET /api/comments/project/:projectId
// @access  Private
const getProjectComments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ 
      project: projectId, 
      task: null // Only project-level comments
    })
      .populate('author', 'name email avatar')
      .populate('mentions.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalComments = await Comment.countDocuments({ 
      project: projectId, 
      task: null 
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: page,
          pages: Math.ceil(totalComments / limit),
          total: totalComments
        }
      }
    });
  } catch (error) {
    console.error('Get project comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, taskId, projectId, ideaId, parentCommentId, mentions } = req.body;

    // Extract mentions from content if not provided
    const extractedMentions = mentions || extractMentionsFromContent(content);

    const commentData = {
      content,
      author: req.user._id,
      mentions: extractedMentions.map(userId => ({ user: userId })),
      ...(taskId && { task: taskId }),
      ...(projectId && { project: projectId }),
      ...(ideaId && { idea: ideaId }),
      ...(parentCommentId && { parentComment: parentCommentId })
    };

    const comment = await Comment.create(commentData);
    await comment.populate('author', 'name email avatar');

    // If it's a reply, add to parent's replies array
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      });
    }

    // Determine the room for socket emission
    let roomId;
    if (taskId) {
      const task = await Task.findById(taskId).populate('project');
      roomId = `project_${task.project._id}`;
    } else if (projectId) {
      roomId = `project_${projectId}`;
    }

    // Emit to appropriate room
    if (roomId) {
      const io = req.app.get('socketio');
      io.to(roomId).emit('comment_created', {
        comment,
        taskId,
        projectId,
        author: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    // TODO: Send notifications to mentioned users

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Store original content for edit history
    const originalContent = comment.originalContent || comment.content;

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        content,
        edited: true,
        editedAt: new Date(),
        originalContent
      },
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar');

    // Emit to appropriate room
    const io = req.app.get('socketio');
    let roomId;
    if (comment.task) {
      const task = await Task.findById(comment.task).populate('project');
      roomId = `project_${task.project._id}`;
    } else if (comment.project) {
      roomId = `project_${comment.project}`;
    }

    if (roomId) {
      io.to(roomId).emit('comment_updated', {
        comment: updatedComment,
        editedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment: updatedComment }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// @desc    Delete comment (soft delete)
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or has admin rights
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete
    await Comment.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id,
      content: '[deleted]'
    });

    // Emit to appropriate room
    const io = req.app.get('socketio');
    let roomId;
    if (comment.task) {
      const task = await Task.findById(comment.task).populate('project');
      roomId = `project_${task.project._id}`;
    } else if (comment.project) {
      roomId = `project_${comment.project}`;
    }

    if (roomId) {
      io.to(roomId).emit('comment_deleted', {
        commentId: id,
        deletedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// @desc    Add reaction to comment
// @route   POST /api/comments/:id/react
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'like' } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(
      reaction => reaction.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type;
    } else {
      // Add new reaction
      comment.reactions.push({
        user: req.user._id,
        type
      });
    }

    await comment.save();

    // Emit to appropriate room
    const io = req.app.get('socketio');
    let roomId;
    if (comment.task) {
      const task = await Task.findById(comment.task).populate('project');
      roomId = `project_${task.project._id}`;
    } else if (comment.project) {
      roomId = `project_${comment.project}`;
    }

    if (roomId) {
      io.to(roomId).emit('comment_reaction', {
        commentId: id,
        reactions: comment.reactions,
        user: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: { reactions: comment.reactions }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: error.message
    });
  }
};

// Helper function to extract mentions from content (@username format)
const extractMentionsFromContent = (content) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // This would need to be converted to actual user IDs
  }

  return mentions;
};

module.exports = {
  getTaskComments,
  getProjectComments,
  createComment,
  updateComment,
  deleteComment,
  addReaction
};