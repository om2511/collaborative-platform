const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Idea = require('../models/Idea');
const Document = require('../models/Document');
const config = require('../config/config');

describe('Analytics API', () => {
  let testUser, adminUser, project, userToken, adminToken;

  beforeAll(async () => {
    // Connect to test database
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
    await Document.deleteMany({});

    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      isActive: true
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    // Generate tokens
    userToken = jwt.sign({ id: testUser._id }, config.jwtSecret, { expiresIn: '1d' });
    adminToken = jwt.sign({ id: adminUser._id }, config.jwtSecret, { expiresIn: '1d' });

    // Create test project
    project = await Project.create({
      name: 'Test Project',
      description: 'Test project description',
      owner: testUser._id,
      team: [{ user: testUser._id, role: 'owner' }],
      status: 'active'
    });

    // Create test tasks
    await Task.create({
      title: 'Completed Task',
      description: 'Test completed task',
      project: project._id,
      assignee: testUser._id,
      status: 'done',
      priority: 'medium'
    });

    await Task.create({
      title: 'In Progress Task',
      description: 'Test in progress task',
      project: project._id,
      assignee: testUser._id,
      status: 'in_progress',
      priority: 'high'
    });

    // Create test ideas
    await Idea.create({
      title: 'Test Idea',
      description: 'Test idea description',
      project: project._id,
      createdBy: testUser._id,
      rating: 4,
      votes: 5
    });

    // Create test documents
    await Document.create({
      title: 'Test Document',
      content: 'Test document content',
      project: project._id,
      createdBy: testUser._id,
      type: 'document'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should get dashboard analytics for authenticated user', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('userTaskStats');
      expect(res.body.data).toHaveProperty('recentTasks');
      expect(res.body.data).toHaveProperty('recentIdeas');
      expect(res.body.data).toHaveProperty('upcomingDeadlines');
      expect(res.body.data).toHaveProperty('projectCount');
      expect(res.body.data).toHaveProperty('activeProjects');
    });

    it('should return 401 for unauthenticated user', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return correct user statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.projectCount).toBe(1);
      expect(res.body.data.activeProjects).toBe(1);
      expect(res.body.data.recentTasks).toHaveLength(2);
      expect(res.body.data.recentIdeas).toHaveLength(1);
    });
  });

  describe('GET /api/analytics/projects/:projectId', () => {
    it('should get project analytics for project member', async () => {
      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('projectInfo');
      expect(res.body.data).toHaveProperty('taskStats');
      expect(res.body.data).toHaveProperty('teamStats');
      expect(res.body.data).toHaveProperty('ideaStats');
      expect(res.body.data).toHaveProperty('documentStats');
      expect(res.body.data).toHaveProperty('insights');
    });

    it('should return 403 for non-project member', async () => {
      const nonMemberUser = await User.create({
        name: 'Non Member',
        email: 'nonmember@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      });

      const nonMemberToken = jwt.sign({ id: nonMemberUser._id }, config.jwtSecret, { expiresIn: '1d' });

      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid project ID', async () => {
      const res = await request(app)
        .get('/api/analytics/projects/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/analytics/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return correct project analytics data', async () => {
      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.projectInfo.name).toBe('Test Project');
      expect(res.body.data.taskStats.totalTasks).toBe(2);
      expect(res.body.data.taskStats.completedTasks).toBe(1);
      expect(res.body.data.taskStats.completionRate).toBe(50);
      expect(res.body.data.ideaStats.totalIdeas).toBe(1);
    });
  });

  describe('GET /api/analytics/team/:teamId', () => {
    it('should get team analytics for team member', async () => {
      // For simplicity, using current user as "team"
      const res = await request(app)
        .get(`/api/analytics/team/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('teamPerformance');
      expect(res.body.data).toHaveProperty('projectStats');
      expect(res.body.data).toHaveProperty('totalProjects');
      expect(res.body.data).toHaveProperty('activeProjects');
    });

    it('should return 400 for invalid team ID', async () => {
      const res = await request(app)
        .get('/api/analytics/team/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return correct team analytics data', async () => {
      const res = await request(app)
        .get(`/api/analytics/team/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.totalProjects).toBe(1);
      expect(res.body.data.activeProjects).toBe(1);
      expect(Array.isArray(res.body.data.projectStats)).toBe(true);
      expect(Array.isArray(res.body.data.teamPerformance)).toBe(true);
    });
  });

  describe('Analytics insights generation', () => {
    it('should generate low completion rate warning', async () => {
      // Create more incomplete tasks to lower completion rate
      await Task.create({
        title: 'Todo Task 1',
        project: project._id,
        assignee: testUser._id,
        status: 'todo',
        priority: 'low'
      });

      await Task.create({
        title: 'Todo Task 2',
        project: project._id,
        assignee: testUser._id,
        status: 'todo',
        priority: 'low'
      });

      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const lowCompletionInsight = res.body.data.insights.find(
        insight => insight.category === 'completion' && insight.type === 'warning'
      );

      expect(lowCompletionInsight).toBeDefined();
      expect(lowCompletionInsight.title).toBe('Low Task Completion Rate');
    });

    it('should generate high completion rate success message', async () => {
      // Create more completed tasks to increase completion rate
      await Task.create({
        title: 'Completed Task 2',
        project: project._id,
        assignee: testUser._id,
        status: 'done',
        priority: 'low'
      });

      await Task.create({
        title: 'Completed Task 3',
        project: project._id,
        assignee: testUser._id,
        status: 'done',
        priority: 'medium'
      });

      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const highCompletionInsight = res.body.data.insights.find(
        insight => insight.category === 'completion' && insight.type === 'success'
      );

      expect(highCompletionInsight).toBeDefined();
      expect(highCompletionInsight.title).toBe('Excellent Progress');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      // Create many tasks to test performance
      const tasks = [];
      for (let i = 0; i < 100; i++) {
        tasks.push({
          title: `Task ${i}`,
          project: project._id,
          assignee: testUser._id,
          status: i % 3 === 0 ? 'done' : i % 3 === 1 ? 'in_progress' : 'todo',
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
        });
      }
      await Task.insertMany(tasks);

      const startTime = Date.now();
      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const endTime = Date.now();

      // Should complete within reasonable time (2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      expect(res.body.data.taskStats.totalTasks).toBe(102); // 100 + 2 original
    });

    it('should handle projects with no tasks gracefully', async () => {
      // Remove all tasks
      await Task.deleteMany({ project: project._id });

      const res = await request(app)
        .get(`/api/analytics/projects/${project._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.taskStats.totalTasks).toBe(0);
      expect(res.body.data.taskStats.completedTasks).toBe(0);
      expect(res.body.data.taskStats.completionRate).toBe(0);
    });

    it('should handle concurrent requests properly', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get(`/api/analytics/projects/${project._id}`)
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.all(requests);
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
});