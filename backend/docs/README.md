# Collaborative Platform API

## Overview

This is the backend API for the Collaborative AI-Powered Ideation & Project Management Platform. The API provides comprehensive endpoints for user management, project collaboration, analytics, and administrative functions.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 5001 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/collaborative_platform |
| `JWT_SECRET` | JWT secret key | (required) |
| `GEMINI_API_KEY` | Google Gemini AI API key | (optional) |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000 |

## 📚 API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Base URL

- Development: `http://localhost:5001/api`
- Production: `https://your-domain.com/api`

### Core Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile

#### Analytics
- `GET /analytics/dashboard` - Get user dashboard analytics
- `GET /analytics/projects/:id` - Get project-specific analytics
- `GET /analytics/team/:id` - Get team analytics

#### Admin (Admin Role Required)
- `GET /admin/users` - List all users with statistics
- `GET /admin/users/:id` - Get user details
- `PATCH /admin/users/:id/status` - Update user status
- `PATCH /admin/users/:id/role` - Update user role
- `DELETE /admin/users/:id` - Delete user (soft delete)
- `GET /admin/analytics` - System-wide analytics
- `GET /admin/logs` - System activity logs

### Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {}, // Response data (on success)
  "errors": [] // Validation errors (on failure)
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:analytics
npm run test:admin
```

### Test Structure

Tests are organized in the `/tests` directory:

- `analytics.test.js` - Analytics endpoints tests
- `admin.test.js` - Admin functionality tests
- `setup.js` - Test configuration and helpers

### Test Database

Tests use a separate MongoDB database (`collab_test`) to avoid interference with development data.

### Test Coverage

Current test coverage focuses on:

- ✅ Analytics endpoints (dashboard, project, team)
- ✅ Admin user management
- ✅ Admin system analytics
- ✅ Authentication and authorization
- ✅ Input validation
- ✅ Error handling
- ✅ Performance testing

## 🔧 Code Quality

### Linting

```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Format code
npm run format
```

### Configuration Files

- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier formatting rules
- `jest.config.js` - Jest testing configuration

## 📊 API Features

### Analytics System

The analytics system provides comprehensive insights:

#### Dashboard Analytics
- Personal task statistics
- Recent activity
- Upcoming deadlines
- Project overview

#### Project Analytics
- Task completion rates
- Team productivity metrics
- Priority distribution
- AI-driven insights

#### AI-Powered Insights
- Low completion rate warnings
- Team engagement analysis
- Activity level monitoring
- Project scope recommendations

### Admin Panel Features

#### User Management
- List users with search and filtering
- View detailed user statistics
- Update user status (activate/deactivate)
- Change user roles
- Soft delete users with project transfer

#### System Monitoring
- System-wide analytics
- User growth metrics
- Activity logs
- Performance monitoring

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes with middleware
- Admin-only endpoints

### Data Protection
- Input validation and sanitization
- MongoDB injection prevention
- XSS protection
- Rate limiting
- Helmet security headers

### Best Practices
- Password hashing with bcryptjs
- Secure JWT secret management
- Environment variable protection
- API versioning ready

## 📈 Performance

### Optimization Features
- Database query optimization
- Aggregation pipelines for analytics
- Efficient pagination
- Connection pooling
- Response compression

### Monitoring
- Request logging
- Error tracking
- Performance metrics
- Health check endpoint (`/health`)

## 🚀 Deployment

### Production Checklist

- [ ] Set secure JWT_SECRET
- [ ] Configure production MongoDB
- [ ] Set appropriate CORS origins
- [ ] Enable rate limiting
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Run security audit
- [ ] Optimize database indexes

### Environment Setup

```bash
# Production environment
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://your-mongo-cluster/collaborative_platform
JWT_SECRET=your-secure-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**
   - Ensure MongoDB is running
   - Check connection string
   - Verify network access

2. **Authentication Errors**
   - Verify JWT secret
   - Check token expiration
   - Ensure proper header format

3. **CORS Issues**
   - Configure CORS_ORIGIN
   - Check request methods
   - Verify credentials handling

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific debug namespace
DEBUG=app:* npm run dev
```

## 📝 Contributing

### Development Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run tests and linting
5. Update documentation
6. Submit pull request

### Code Standards

- Follow ESLint configuration
- Use Prettier for formatting
- Write comprehensive tests
- Document API changes
- Follow semantic versioning

## 📞 Support

For API support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review test examples
- Consult API documentation

## 🔄 API Versioning

Current version: `v1.0.0`

Future versions will maintain backward compatibility with deprecation notices.