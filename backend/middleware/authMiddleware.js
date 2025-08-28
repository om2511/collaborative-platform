const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Demo mode fallback when database is not available
      if (!User.db || User.db.readyState !== 1) {
        console.log('Auth middleware: Database not ready, using demo mode');
        
        if (decoded.id === '507f1f77bcf86cd799439011') {
          req.user = {
            _id: '507f1f77bcf86cd799439011',
            id: '507f1f77bcf86cd799439011',
            name: 'Demo User',
            email: 'demo@example.com',
            role: 'team_member',
            department: 'Engineering',
            bio: 'This is a demo user account for testing purposes.',
            skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
            avatar: '',
            lastLogin: new Date(),
            createdAt: new Date(),
            isActive: true,
            projects: []
          };
          next();
          return;
        }
      }

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: '1d' // Set to 1 day as requested
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: '7d' // Refresh token lasts 7 days
  });
};

module.exports = { protect, generateToken, generateRefreshToken };