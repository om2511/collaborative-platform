// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/collab_test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock external services
jest.mock('../services/aiService', () => ({
  generateIdeaInsights: jest.fn().mockResolvedValue({
    summary: 'Test AI insight',
    score: 85,
    suggestions: ['Test suggestion 1', 'Test suggestion 2']
  }),
  generateProjectAnalysis: jest.fn().mockResolvedValue({
    summary: 'Test project analysis',
    recommendations: ['Test recommendation 1']
  })
}));

// Global test utilities
global.testHelpers = {
  // Helper to create test user data
  createUserData: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    ...overrides
  }),

  // Helper to create test project data
  createProjectData: (owner, overrides = {}) => ({
    name: 'Test Project',
    description: 'Test project description',
    owner,
    team: [{ user: owner, role: 'owner' }],
    status: 'active',
    ...overrides
  }),

  // Helper to create test task data
  createTaskData: (project, assignee, overrides = {}) => ({
    title: 'Test Task',
    description: 'Test task description',
    project,
    assignee,
    status: 'todo',
    priority: 'medium',
    ...overrides
  })
};

// Console warning suppression for tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = (...args) => {
    if (args[0]?.includes && args[0].includes('Warning')) {
      return;
    }
    originalWarn(...args);
  };
});

afterEach(() => {
  console.warn = originalWarn;
});