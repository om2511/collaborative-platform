const Chat = require('../models/Chat');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get project chat messages
// @route   GET /api/chat/project/:projectId
// @access  Private (Project members only)
const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find or create chat for this project
    let chat = await Chat.findOne({ project: projectId, type: 'project' })
      .populate('messages.sender', 'name email avatar')
      .sort({ 'messages.createdAt': 1 });

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = await Chat.create({
        project: projectId,
        type: 'project',
        participants: [req.user._id],
        messages: []
      });
    } else {
      // Add user to participants if not already added
      if (!chat.participants.includes(req.user._id)) {
        chat.participants.push(req.user._id);
        await chat.save();
      }
    }

    // Transform messages to match frontend format
    const messages = chat.messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      type: msg.messageType,
      sender: {
        id: msg.sender._id,
        name: msg.sender.name,
        avatar: msg.sender.avatar
      },
      timestamp: msg.createdAt,
      isEdited: msg.isEdited,
      editedAt: msg.editedAt
    }));

    res.json({
      success: true,
      count: messages.length,
      data: { messages }
    });
  } catch (error) {
    console.error('Get project messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Send message to project chat
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId, content, type = 'text' } = req.body;

    // Validate project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to project
    const hasAccess = project.team.some(member => 
      member.user.toString() === req.user._id.toString()
    ) || project.owner.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Find or create chat for this project
    let chat = await Chat.findOne({ project: projectId, type: 'project' });

    if (!chat) {
      chat = await Chat.create({
        project: projectId,
        type: 'project',
        participants: [req.user._id],
        messages: []
      });
    } else {
      // Add user to participants if not already added
      if (!chat.participants.includes(req.user._id)) {
        chat.participants.push(req.user._id);
      }
    }

    // Create new message
    const newMessage = {
      sender: req.user._id,
      content: content.trim(),
      messageType: type,
      createdAt: new Date()
    };

    // Add message to chat
    chat.messages.push(newMessage);
    chat.lastMessage = new Date();
    await chat.save();

    // Populate sender info for response
    await chat.populate('messages.sender', 'name email avatar');
    
    // Get the newly created message
    const savedMessage = chat.messages[chat.messages.length - 1];
    
    // Transform message to match frontend format
    const responseMessage = {
      id: savedMessage._id.toString(),
      content: savedMessage.content,
      type: savedMessage.messageType,
      sender: {
        id: savedMessage.sender._id,
        name: savedMessage.sender.name,
        avatar: savedMessage.sender.avatar
      },
      timestamp: savedMessage.createdAt,
      projectId: projectId
    };

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: responseMessage }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/message/:messageId
// @access  Private (Message sender only)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find chat containing the message
    const chat = await Chat.findOne({
      'messages._id': messageId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find the specific message
    const message = chat.messages.id(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or project owner
    const project = await Project.findById(chat.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSender = message.sender.toString() === req.user._id.toString();

    if (!isOwner && !isSender) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Remove message
    message.remove();
    chat.lastMessage = chat.messages.length > 0 ? 
      chat.messages[chat.messages.length - 1].createdAt : 
      new Date();
    
    await chat.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// @desc    Edit message
// @route   PUT /api/chat/message/:messageId
// @access  Private (Message sender only)
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Find chat containing the message
    const chat = await Chat.findOne({
      'messages._id': messageId
    }).populate('messages.sender', 'name email avatar');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find the specific message
    const message = chat.messages.id(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    
    await chat.save();

    // Transform message to match frontend format
    const responseMessage = {
      id: message._id.toString(),
      content: message.content,
      type: message.messageType,
      sender: {
        id: message.sender._id,
        name: message.sender.name,
        avatar: message.sender.avatar
      },
      timestamp: message.createdAt,
      isEdited: message.isEdited,
      editedAt: message.editedAt
    };

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: { message: responseMessage }
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message
    });
  }
};

// @desc    Clear all messages from project chat
// @route   DELETE /api/chat/project/:projectId/clear
// @access  Private (Project members only)
const clearProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to project (owner or member)
    const hasAccess = project.team.some(member => 
      member.user.toString() === req.user._id.toString()
    ) || project.owner.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Find and clear chat messages
    const chat = await Chat.findOne({ project: projectId, type: 'project' });

    if (chat) {
      chat.messages = [];
      chat.lastMessage = new Date();
      await chat.save();

      // Emit to project room for real-time updates
      const io = req.app.get('socketio');
      io.to(`project_${projectId}`).emit('chat_cleared', {
        projectId,
        clearedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Chat messages cleared successfully'
    });
  } catch (error) {
    console.error('Clear project messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing messages',
      error: error.message
    });
  }
};

module.exports = {
  getProjectMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  clearProjectMessages
};