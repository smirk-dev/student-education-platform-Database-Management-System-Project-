/**
 * Main Express Server
 * 
 * Hybrid Student Learning Portal
 * Uses MySQL for relational data and MongoDB for flexible data
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Database connections
const { testConnection: testMySQL, closeConnection: closeMySQLConnection } = require('./config/mysql');
const { connectMongoDB, closeConnection: closeMongoConnection } = require('./config/mongodb');

// Routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const quizRoutes = require('./routes/quizRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    databases: {
      mysql: 'connected',
      mongodb: 'connected'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', quizRoutes);
app.use('/api', discussionRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', activityRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Hybrid Student Learning Portal API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password'
      },
      courses: {
        getAll: 'GET /api/courses',
        getById: 'GET /api/courses/:id',
        create: 'POST /api/courses (instructor/admin)',
        myEnrolled: 'GET /api/courses/my/courses (student)',
        enroll: 'POST /api/courses/:id/enroll (student)',
        getStudents: 'GET /api/courses/:id/students (instructor/admin)',
        database: 'MySQL'
      },
      quizzes: {
        getCourse: 'GET /api/courses/:courseId/quizzes',
        getById: 'GET /api/quizzes/:quizId',
        submit: 'POST /api/quizzes/:quizId/submit (student)',
        getMy: 'GET /api/quizzes/my/submissions (student)',
        stats: 'GET /api/quizzes/:quizId/stats (instructor)',
        database: 'MySQL'
      },
      discussions: {
        getCourse: 'GET /api/courses/:courseId/discussions',
        getById: 'GET /api/discussions/:discussionId',
        create: 'POST /api/courses/:courseId/discussions',
        addComment: 'POST /api/discussions/:discussionId/comments',
        addReply: 'POST /api/discussions/:discussionId/comments/:commentId/replies',
        upvote: 'POST /api/discussions/:discussionId/upvote',
        database: 'MongoDB'
      },
      assignments: {
        getCourse: 'GET /api/courses/:courseId/assignments',
        getMy: 'GET /api/assignments/my (student)',
        getById: 'GET /api/assignments/:assignmentId',
        submit: 'POST /api/courses/:courseId/assignments (student)',
        grade: 'POST /api/assignments/:assignmentId/grade (instructor)',
        stats: 'GET /api/courses/:courseId/assignments/stats (instructor)',
        database: 'MongoDB'
      },
      activity: {
        getMy: 'GET /api/activity/me',
        getMyStats: 'GET /api/activity/me/stats',
        getCourse: 'GET /api/courses/:courseId/activity (instructor)',
        getPlatform: 'GET /api/stats/platform (admin)',
        database: 'MongoDB'
      }
    }
  });
});

// Catch-all route for frontend (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize databases and start server
const startServer = async () => {
  try {
    console.log('\n========================================');
    console.log('Starting Hybrid Student Learning Portal');
    console.log('========================================\n');
    
    // Connect to MySQL
    console.log('Connecting to MySQL...');
    await testMySQL();
    
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await connectMongoDB();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('\n========================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  Local: http://localhost:${PORT}`);
      console.log(`  API: http://localhost:${PORT}/api`);
      console.log('========================================\n');
    });
    
    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n\nShutting down gracefully...');
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        await closeMySQLConnection();
        await closeMongoConnection();
        
        console.log('Goodbye! 👋\n');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('\n✗ Failed to start server:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. MySQL is running and credentials in .env are correct');
    console.error('2. MongoDB is running and connection string is correct');
    console.error('3. Run SQL schema: mysql -u root -p < database/mysql/schema.sql\n');
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
