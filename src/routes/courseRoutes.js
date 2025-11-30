/**
 * Course Routes
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Public routes (with optional auth for enrollment status)
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);

// Student routes
router.get('/my/courses', 
  authenticateToken, 
  requireRole('student'), 
  courseController.getMyEnrolledCourses
);

router.post('/:id/enroll', 
  authenticateToken, 
  requireRole('student'),
  logActivity('ENROLL_COURSE', { resourceType: 'enrollment' }),
  courseController.enrollInCourse
);

// Instructor/Admin routes
router.post('/', 
  authenticateToken, 
  requireRole('instructor', 'admin'),
  logActivity('CREATE_COURSE', { resourceType: 'course' }),
  courseController.createCourse
);

router.get('/:id/students', 
  authenticateToken, 
  requireRole('instructor', 'admin'),
  courseController.getCourseStudents
);

module.exports = router;
