/**
 * Discussion Routes
 * 
 * MongoDB-based discussion forum endpoints
 */

const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Get discussions for a course
router.get(
  '/courses/:courseId/discussions',
  authenticateToken,
  logActivity('view_discussions', { resourceType: 'discussion' }),
  discussionController.getCourseDiscussions
);

// Get single discussion
router.get(
  '/discussions/:discussionId',
  authenticateToken,
  logActivity('view_discussion', { resourceType: 'discussion' }),
  discussionController.getDiscussionById
);

// Create new discussion
router.post(
  '/courses/:courseId/discussions',
  authenticateToken,
  logActivity('create_discussion', { resourceType: 'discussion' }),
  discussionController.createDiscussion
);

// Add comment to discussion
router.post(
  '/discussions/:discussionId/comments',
  authenticateToken,
  logActivity('add_comment', { resourceType: 'comment' }),
  discussionController.addComment
);

// Add reply to comment
router.post(
  '/discussions/:discussionId/comments/:commentId/replies',
  authenticateToken,
  logActivity('add_reply', { resourceType: 'reply' }),
  discussionController.addReply
);

// Upvote discussion
router.post(
  '/discussions/:discussionId/upvote',
  authenticateToken,
  logActivity('upvote_discussion', { resourceType: 'discussion' }),
  discussionController.upvoteDiscussion
);

module.exports = router;
