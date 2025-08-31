const Project = require('../models/Project');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    
    // Build query
    const query = {
      $or: [
        { owner: req.user._id },
        { 'team.user': req.user._id }
      ]
    };

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$and = [
        query.$and || {},
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('team.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: { projects }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar department')
      .populate('team.user', 'name email avatar department role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to project
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user._id.toString() === req.user._id.toString()) ||
                     project.settings.isPublic;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectData = {
      ...req.body,
      owner: req.user._id,
      team: [{
        user: req.user._id,
        role: 'owner',
        joinedAt: new Date()
      }],
      // Set default settings that are more sharing-friendly
      settings: {
        isPublic: req.body.settings?.isPublic ?? true,
        allowGuestAccess: req.body.settings?.allowGuestAccess ?? true,
        notifications: req.body.settings?.notifications ?? true,
        ...req.body.settings
      }
    };

    const project = await Project.create(projectData);

    // Add project to user's projects array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { projects: project._id }
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or has manager role
    const isOwner = project.owner.toString() === req.user._id.toString();
    const teamMember = project.team.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    const canEdit = isOwner || (teamMember && ['manager'].includes(teamMember.role));

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    const allowedFields = [
      'title', 'description', 'category', 'status', 'priority', 
      'startDate', 'endDate', 'deadline', 'tags', 'settings', 'budget'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar')
     .populate('team.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private
const addTeamMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or manager
    const isOwner = project.owner.toString() === req.user._id.toString();
    const teamMember = project.team.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    const canAddMembers = isOwner || (teamMember && ['manager'].includes(teamMember.role));

    if (!canAddMembers) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add team members'
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in team
    const existingMember = project.team.find(member => 
      member.user.toString() === userId
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Add team member
    project.team.push({
      user: userId,
      role,
      joinedAt: new Date()
    });

    await project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(userId, {
      $push: { projects: project._id }
    });

    await project.populate('team.user', 'name email avatar');

    // Get the newly added member for socket emission
    const newMember = project.team[project.team.length - 1];

    // Emit socket event for real-time updates
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${project._id}`).emit('team_member_added', {
        projectId: project._id,
        newMember: {
          user: newMember.user,
          role: newMember.role,
          joinedAt: newMember.joinedAt
        }
      });
    }

    res.json({
      success: true,
      message: 'Team member added successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding team member',
      error: error.message
    });
  }
};

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team/:userId
// @access  Private
const removeTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can remove team members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can remove team members'
      });
    }

    // Cannot remove owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    // Get user info before removing for socket emission
    const userToRemove = await User.findById(userId).select('name');

    // Remove team member
    project.team = project.team.filter(member => 
      member.user.toString() !== userId
    );

    await project.save();

    // Remove project from user's projects
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: project._id }
    });

    // Emit socket event for real-time updates
    const io = req.app.get('socketio');
    if (io && userToRemove) {
      io.to(`project_${project._id}`).emit('team_member_removed', {
        projectId: project._id,
        removedUserId: userId,
        removedUserName: userToRemove.name
      });
    }

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing team member',
      error: error.message
    });
  }
};

// @desc    Join project (for public projects with guest access)
// @route   POST /api/projects/:id/join
// @access  Private
const joinProject = async (req, res) => {
  try {
    console.log('Join project request for project ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const project = await Project.findById(req.params.id);

    if (!project) {
      console.log('Project not found');
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('Project settings:', project.settings);
    console.log('Project owner:', project.owner);
    console.log('Current team members:', project.team.map(m => m.user.toString()));

    // Check if project allows joining - handle missing settings
    const isPublic = project.settings?.isPublic ?? false;
    const allowGuestAccess = project.settings?.allowGuestAccess ?? false;
    
    console.log('isPublic:', isPublic, 'allowGuestAccess:', allowGuestAccess);

    if (!isPublic || !allowGuestAccess) {
      console.log('Project does not allow public access - isPublic:', isPublic, 'allowGuestAccess:', allowGuestAccess);
      return res.status(403).json({
        success: false,
        message: 'This project does not allow public access'
      });
    }

    // Check if user is already in team
    const existingMember = project.team.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (existingMember) {
      console.log('User is already a member');
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this project'
      });
    }

    // Check if user is the owner
    if (project.owner.toString() === req.user._id.toString()) {
      console.log('User is the owner');
      return res.status(400).json({
        success: false,
        message: 'You are the owner of this project'
      });
    }

    // Add user to team as viewer by default
    project.team.push({
      user: req.user._id,
      role: 'viewer',
      joinedAt: new Date()
    });

    await project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { projects: project._id }  // Use $addToSet to avoid duplicates
    });

    // Populate the new member info
    await project.populate('team.user', 'name email avatar');

    // Get the newly added member
    const newMember = project.team[project.team.length - 1];

    // Emit socket event for real-time updates
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${project._id}`).emit('team_member_added', {
        projectId: project._id,
        newMember: {
          user: newMember.user,
          role: newMember.role,
          joinedAt: newMember.joinedAt
        }
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined the project',
      data: { 
        project,
        newMember: {
          user: newMember.user,
          role: newMember.role,
          joinedAt: newMember.joinedAt
        }
      }
    });
  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining project',
      error: error.message
    });
  }
};

// @desc    Update project settings (temporary helper)
// @route   PATCH /api/projects/:id/settings
// @access  Private
const updateProjectSettings = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can update settings
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can update settings'
      });
    }

    // Update settings
    project.settings = {
      ...project.settings,
      ...req.body
    };

    await project.save();

    res.json({
      success: true,
      message: 'Project settings updated successfully',
      data: { settings: project.settings }
    });
  } catch (error) {
    console.error('Update project settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project settings',
      error: error.message
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  addTeamMember,
  removeTeamMember,
  joinProject,
  updateProjectSettings
};