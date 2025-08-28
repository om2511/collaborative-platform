const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Idea = require('../models/Idea');
const config = require('../config/config');

describe('Admin API', () => {
  let adminUser, regularUser, managerUser, adminToken, userToken, managerToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/collab_test');
    }
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Idea.deleteMany({});

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
      isActive: true
    });

    managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
      isActive: true
    });

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser._id }, config.jwtSecret, { expiresIn: '1d' });
    userToken = jwt.sign({ id: regularUser._id }, config.jwtSecret, { expiresIn: '1d' });
    managerToken = jwt.sign({ id: managerUser._id }, config.jwtSecret, { expiresIn: '1d' });

    // Create some test data
    const project = await Project.create({
      name: 'Test Project',
      description: 'Test project description',
      owner: regularUser._id,
      team: [{ user: regularUser._id, role: 'owner' }],
      status: 'active'
    });

    await Task.create({
      title: 'Test Task',
      description: 'Test task description',
      project: project._id,
      assignee: regularUser._id,
      status: 'done'
    });

    await Idea.create({
      title: 'Test Idea',
      description: 'Test idea description',
      project: project._id,
      createdBy: regularUser._id,
      rating: 4
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/admin/users', () => {
    it('should get all users for admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users).toHaveLength(3);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should support search functionality', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].name).toBe('Admin User');
    });

    it('should support role filtering', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=manager')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].role).toBe('manager');
    });

    it('should support status filtering', async () => {
      // Deactivate one user first
      await User.findByIdAndUpdate(regularUser._id, { isActive: false });

      const res = await request(app)
        .get('/api/admin/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.users).toHaveLength(2);
      res.body.data.users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should include user statistics', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const userWithStats = res.body.data.users.find(u => u._id === regularUser._id.toString());
      expect(userWithStats.stats).toHaveProperty('projects');
      expect(userWithStats.stats).toHaveProperty('tasks');
      expect(userWithStats.stats).toHaveProperty('ideas');
      expect(userWithStats.stats.projects).toBe(1);
      expect(userWithStats.stats.tasks).toBe(1);
      expect(userWithStats.stats.ideas).toBe(1);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user details for admin', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('recentActivity');
      expect(res.body.data.user.name).toBe('Regular User');
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .get('/api/admin/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/users/:id/status', () => {
    it('should update user status for admin', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: 'Test deactivation'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      
      // Verify the user was actually updated
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.statusChangeReason).toBe('Test deactivation');
    });

    it('should prevent admin from deactivating themselves', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: 'Self deactivation'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You cannot deactivate your own account');
    });

    it('should validate request body', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: 'invalid'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('should update user role for admin', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'manager'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      
      // Verify the user was actually updated
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.role).toBe('manager');
    });

    it('should prevent admin from changing their own role', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'user'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You cannot change your own role');
    });

    it('should validate role values', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'invalid-role'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user for admin', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      
      // Verify the user was soft deleted
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser.isDeleted).toBe(true);
      expect(deletedUser.isActive).toBe(false);
      expect(deletedUser.deletedAt).toBeDefined();
    });

    it('should prevent admin from deleting themselves', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You cannot delete your own account');
    });

    it('should transfer projects when specified', async () => {
      // Create a project owned by the user to be deleted
      const project = await Project.create({
        name: 'Project to Transfer',
        description: 'Test project',
        owner: regularUser._id,
        team: [{ user: regularUser._id, role: 'owner' }]
      });

      const res = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transferProjectsTo: managerUser._id
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      
      // Verify project was transferred
      const updatedProject = await Project.findById(project._id);
      expect(updatedProject.owner.toString()).toBe(managerUser._id.toString());
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should get system analytics for admin', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overview');
      expect(res.body.data).toHaveProperty('distributions');
      expect(res.body.data).toHaveProperty('growth');
      expect(res.body.data).toHaveProperty('recentActivity');

      // Check overview data
      expect(res.body.data.overview.totalUsers).toBe(3);
      expect(res.body.data.overview.activeUsers).toBe(3);
      expect(res.body.data.overview.totalProjects).toBe(1);
      expect(res.body.data.overview.totalTasks).toBe(1);
      expect(res.body.data.overview.totalIdeas).toBe(1);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should get system logs for admin', async () => {
      const res = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/logs?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.pagination.current).toBe(1);
      expect(res.body.data.logs.length).toBeLessThanOrEqual(2);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Authorization and Security', () => {
    it('should require authentication for all admin routes', async () => {
      const routes = [
        '/api/admin/users',
        '/api/admin/analytics',
        '/api/admin/logs'
      ];

      for (const route of routes) {
        const res = await request(app)
          .get(route)
          .expect(401);

        expect(res.body.success).toBe(false);
      }
    });

    it('should reject invalid JWT tokens', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: adminUser._id },
        config.jwtSecret,
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should prevent manager from accessing admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});