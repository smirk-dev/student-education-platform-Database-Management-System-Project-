/**
 * Assignment Routes
 * 
 * MongoDB-based assignment submission and grading endpoints
 */

const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Get assignments for a course
router.get(
  '/courses/:courseId/assignments',
  authenticateToken,
  logActivity('view_assignments', { resourceType: 'assignment' }),
  assignmentController.getCourseAssignments
);

// Get student's own assignments
router.get(
  '/assignments/my',
  authenticateToken,
  requireRole(['student']),
  logActivity('view_my_assignments', { resourceType: 'assignment' }),
  assignmentController.getStudentAssignments
);

// Get single assignment
router.get(
  '/assignments/:assignmentId',
  authenticateToken,
  logActivity('view_assignment', { resourceType: 'assignment' }),
  assignmentController.getAssignmentById
);

// Submit assignment
router.post(
  '/courses/:courseId/assignments',
  authenticateToken,
  requireRole(['student']),
  logActivity('submit_assignment', { resourceType: 'assignment' }),
  assignmentController.submitAssignment
);

// Grade assignment (instructor only)
router.post(
  '/assignments/:assignmentId/grade',
  authenticateToken,
  requireRole(['instructor', 'admin']),
  logActivity('grade_assignment', { resourceType: 'assignment' }),
  assignmentController.gradeAssignment
);

// Get assignment statistics
router.get(
  '/courses/:courseId/assignments/stats',
  authenticateToken,
  requireRole(['instructor', 'admin']),
  logActivity('view_assignment_stats', { resourceType: 'statistics' }),
  assignmentController.getAssignmentStats
);

module.exports = router;
