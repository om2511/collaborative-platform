const Idea = require('../models/Idea');
const Project = require('../models/Project');
const aiService = require('../services/aiService');
const { validationResult } = require('express-validator');

// @desc    Generate AI ideas
// @route   POST /api/ideas/generate
// @access  Private
const generateIdeas = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { prompt, projectId } = req.body;

    // Get project context for better AI generation
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to project
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Get existing ideas for context
    const existingIdeas = await Idea.find({ project: projectId })
      .select('title')
      .limit(10);

    const context = {
      projectCategory: project.category,
      projectDescription: project.description,
      teamSize: project.team.length,
      existingIdeas: existingIdeas.map(idea => idea.title)
    };

    // Generate ideas using AI
    const generatedIdeas = await aiService.generateIdeas(prompt, context);

    // Save generated ideas to database
    const savedIdeas = [];
    for (const ideaData of generatedIdeas) {
      const idea = new Idea({
        title: ideaData.title,
        description: ideaData.description,
        project: projectId,
        creator: req.user._id,
        aiGenerated: true,
        aiPrompt: prompt,
        implementation: {
          feasibilityScore: Math.floor(Math.random() * 10) + 1, // Random score for demo
          impactScore: Math.floor(Math.random() * 10) + 1,
          estimatedEffort: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          requiredResources: [ideaData.implementation],
          timeline: ideaData.impact
        }
      });

      await idea.save();
      await idea.populate('creator', 'name email avatar');
      savedIdeas.push(idea);
    }

    // Emit to project room for real-time updates
    const io = req.app.get('socketio');
    io.to(`project_${projectId}`).emit('ideas_generated', {
      ideas: savedIdeas,
      generatedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Ideas generated successfully',
      data: { ideas: savedIdeas }
    });
  } catch (error) {
    console.error('=== GENERATE IDEAS ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate ideas',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Get all ideas for current user
// @route   GET /api/ideas
// @access  Private
const getAllIdeas = async (req, res) => {
  try {
    const { category, status, sort = '-createdAt' } = req.query;

    // Build query to get ideas from projects user has access to
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'team.user': req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(project => project._id);

    // Build ideas query
    const query = { project: { $in: projectIds } };
    if (category) query.category = category;
    if (status) query.status = status;

    const ideas = await Idea.find(query)
      .populate('creator', 'name email avatar')
      .populate('project', 'name')
      .sort(sort)
      .lean();

    // Calculate total votes for each idea
    const ideasWithVotes = ideas.map(idea => ({
      ...idea,
      totalVotes: idea.votes.upvotes.length - idea.votes.downvotes.length
    }));

    res.json({
      success: true,
      count: ideasWithVotes.length,
      data: { ideas: ideasWithVotes }
    });
  } catch (error) {
    console.error('Get all ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ideas',
      error: error.message
    });
  }
};

// @desc    Get project ideas
// @route   GET /api/ideas/project/:projectId
// @access  Private
const getProjectIdeas = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { category, status, sort = '-createdAt' } = req.query;

    // Build query
    const query = { project: projectId };
    if (category) query.category = category;
    if (status) query.status = status;

    const ideas = await Idea.find(query)
      .populate('creator', 'name email avatar')
      .sort(sort)
      .lean();

    // Calculate total votes for each idea
    const ideasWithVotes = ideas.map(idea => ({
      ...idea,
      totalVotes: idea.votes.upvotes.length - idea.votes.downvotes.length
    }));

    res.json({
      success: true,
      count: ideasWithVotes.length,
      data: { ideas: ideasWithVotes }
    });
  } catch (error) {
    console.error('Get project ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ideas',
      error: error.message
    });
  }
};

// @desc    Create manual idea
// @route   POST /api/ideas
// @access  Private
const createIdea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const ideaData = {
      ...req.body,
      creator: req.user._id,
      aiGenerated: false
    };

    const idea = await Idea.create(ideaData);
    await idea.populate('creator', 'name email avatar');

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${idea.project}`).emit('idea_created', {
      idea,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Idea created successfully',
      data: { idea }
    });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating idea',
      error: error.message
    });
  }
};

// @desc    Vote on idea
// @route   POST /api/ideas/:id/vote
// @access  Private
const voteOnIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'upvote' or 'downvote'

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Remove any existing vote by this user
    idea.votes.upvotes = idea.votes.upvotes.filter(
      vote => vote.user.toString() !== req.user._id.toString()
    );
    idea.votes.downvotes = idea.votes.downvotes.filter(
      vote => vote.user.toString() !== req.user._id.toString()
    );

    // Add new vote
    if (type === 'upvote') {
      idea.votes.upvotes.push({ user: req.user._id });
    } else if (type === 'downvote') {
      idea.votes.downvotes.push({ user: req.user._id });
    }

    await idea.save();

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${idea.project}`).emit('idea_voted', {
      ideaId: idea._id,
      votes: {
        upvotes: idea.votes.upvotes.length,
        downvotes: idea.votes.downvotes.length
      },
      votedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        votes: {
          upvotes: idea.votes.upvotes.length,
          downvotes: idea.votes.downvotes.length,
          total: idea.votes.upvotes.length - idea.votes.downvotes.length
        }
      }
    });
  } catch (error) {
    console.error('Vote on idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message
    });
  }
};

// @desc    Add comment to idea
// @route   POST /api/ideas/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim()
    };

    idea.comments.push(comment);
    await idea.save();

    await idea.populate('comments.user', 'name email avatar');

    // Get the newly added comment
    const newComment = idea.comments[idea.comments.length - 1];

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${idea.project}`).emit('idea_commented', {
      ideaId: idea._id,
      comment: newComment,
      commentedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: newComment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Get single idea
// @route   GET /api/ideas/:id
// @access  Private
const getIdea = async (req, res) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id)
      .populate('creator', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    res.json({
      success: true,
      data: { idea }
    });
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching idea',
      error: error.message
    });
  }
};

// @desc    Delete idea
// @route   DELETE /api/ideas/:id
// @access  Private
const deleteIdea = async (req, res) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Check if user is the creator or has admin/manager role
    const canDelete = idea.creator.toString() === req.user._id.toString() ||
                     req.user.role === 'admin' ||
                     req.user.role === 'manager';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this idea'
      });
    }

    await Idea.findByIdAndDelete(id);

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${idea.project}`).emit('idea_deleted', {
      ideaId: id,
      deletedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Idea deleted successfully'
    });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting idea',
      error: error.message
    });
  }
};

module.exports = {
  generateIdeas,
  getAllIdeas,
  getProjectIdeas,
  createIdea,
  voteOnIdea,
  addComment,
  getIdea,
  deleteIdea
};