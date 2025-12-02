/**
 * Quiz Routes
 * 
 * MySQL-based quiz and submission endpoints
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Get quizzes for a course
router.get(
  '/courses/:courseId/quizzes',
  authenticateToken,
  logActivity('view_quizzes', { resourceType: 'quiz' }),
  quizController.getCourseQuizzes
);

// Get single quiz
router.get(
  '/quizzes/:quizId',
  authenticateToken,
  logActivity('view_quiz', { resourceType: 'quiz' }),
  quizController.getQuizById
);

// Submit quiz
router.post(
  '/quizzes/:quizId/submit',
  authenticateToken,
  requireRole(['student']),
  logActivity('submit_quiz', { resourceType: 'quiz_submission' }),
  quizController.submitQuiz
);

// Get student's submissions
router.get(
  '/quizzes/my/submissions',
  authenticateToken,
  requireRole(['student']),
  logActivity('view_my_submissions', { resourceType: 'quiz_submission' }),
  quizController.getMySubmissions
);

// Get quiz statistics
router.get(
  '/quizzes/:quizId/stats',
  authenticateToken,
  requireRole(['instructor', 'admin']),
  logActivity('view_quiz_stats', { resourceType: 'statistics' }),
  quizController.getQuizStats
);

module.exports = router;
