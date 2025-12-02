/**
 * Activity Routes
 * 
 * User activity tracking and statistics endpoints
 */

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get user's own activity logs
router.get(
  '/activity/me',
  authenticateToken,
  activityController.getUserActivity
);

// Get user's activity statistics
router.get(
  '/activity/me/stats',
  authenticateToken,
  activityController.getUserActivityStats
);

// Get course activity (instructor/admin)
router.get(
  '/courses/:courseId/activity',
  authenticateToken,
  requireRole(['instructor', 'admin']),
  activityController.getCourseActivity
);

// Get platform-wide statistics (admin only)
router.get(
  '/stats/platform',
  authenticateToken,
  requireRole(['admin']),
  activityController.getPlatformStats
);

module.exports = router;
