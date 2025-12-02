/**
 * Discussion Controller
 * 
 * Handles discussion forum operations using MongoDB
 */

const Discussion = require('../models/Discussion');

/**
 * Get all discussions for a course
 */
const getCourseDiscussions = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const discussions = await Discussion.find({ course_id: parseInt(courseId) })
      .sort({ created_at: -1 })
      .limit(50);
    
    res.json({
      success: true,
      message: 'Discussions retrieved successfully',
      data: {
        discussions,
        count: discussions.length,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve discussions',
      error: error.message
    });
  }
};

/**
 * Get single discussion by ID
 */
const getDiscussionById = async (req, res) => {
  try {
    const { discussionId } = req.params;
    
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Discussion retrieved successfully',
      data: {
        discussion,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve discussion',
      error: error.message
    });
  }
};

/**
 * Create new discussion thread
 */
const createDiscussion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    const discussion = await Discussion.createDiscussion({
      course_id: parseInt(courseId),
      author_id: req.user.user_id,
      author_name: req.user.name,
      title,
      content,
      tags: tags || []
    });
    
    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: {
        discussion,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion',
      error: error.message
    });
  }
};

/**
 * Add comment to discussion
 */
const addComment = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }
    
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    const comment = discussion.addComment(
      req.user.user_id,
      req.user.name,
      content
    );
    
    await discussion.save();
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment,
        discussion_id: discussion._id,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

/**
 * Add reply to a comment
 */
const addReply = async (req, res) => {
  try {
    const { discussionId, commentId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }
    
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    const comment = discussion.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    const reply = {
      author_id: req.user.user_id,
      author_name: req.user.name,
      content
    };
    
    comment.replies.push(reply);
    await discussion.save();
    
    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: {
        reply,
        comment_id: commentId,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

/**
 * Upvote discussion
 */
const upvoteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    discussion.upvote(req.user.user_id);
    await discussion.save();
    
    res.json({
      success: true,
      message: 'Discussion upvoted',
      data: {
        upvotes: discussion.upvotes,
        upvoted_by: discussion.upvoted_by,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upvote discussion',
      error: error.message
    });
  }
};

module.exports = {
  getCourseDiscussions,
  getDiscussionById,
  createDiscussion,
  addComment,
  addReply,
  upvoteDiscussion
};
