/**
 * DISCUSSION MODEL (MongoDB)
 * 
 * Purpose: Store course discussion threads with nested posts/comments
 * Why MongoDB?: Discussion threads are naturally hierarchical and benefit from
 * document embedding. Flexible schema allows for future enhancements like
 * reactions, attachments, etc.
 * 
 * Design Decision: Embedding posts within threads for better read performance
 * and atomic updates.
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  post_id: {
    type: Number,
    required: true
  },
  user_id: {
    type: Number,
    required: true,
    // References MySQL users.user_id
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  edited_at: {
    type: Date
  },
  is_edited: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const discussionSchema = new mongoose.Schema({
  course_id: {
    type: Number,
    required: true,
    index: true,
    // References MySQL courses.course_id
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  created_by: {
    type: Number,
    required: true,
    // References MySQL users.user_id
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  is_locked: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  posts: [postSchema],
  post_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'discussions'
});

// Index for efficient queries
discussionSchema.index({ course_id: 1, created_at: -1 });
discussionSchema.index({ created_by: 1 });
discussionSchema.index({ 'posts.user_id': 1 });

// Method to add a new post
discussionSchema.methods.addPost = function(userId, content) {
  const newPostId = this.posts.length > 0 
    ? Math.max(...this.posts.map(p => p.post_id)) + 1 
    : 1;
  
  this.posts.push({
    post_id: newPostId,
    user_id: userId,
    content: content,
    created_at: new Date()
  });
  
  this.post_count = this.posts.length;
  this.updated_at = new Date();
  
  return this.save();
};

// Method to edit a post
discussionSchema.methods.editPost = function(postId, newContent) {
  const post = this.posts.find(p => p.post_id === postId);
  if (!post) {
    throw new Error('Post not found');
  }
  
  post.content = newContent;
  post.edited_at = new Date();
  post.is_edited = true;
  this.updated_at = new Date();
  
  return this.save();
};

// Static method to get discussions by course
discussionSchema.statics.findByCourse = function(courseId, options = {}) {
  const { limit = 20, skip = 0, pinned = false } = options;
  
  const query = { course_id: courseId };
  if (pinned !== null) {
    query.is_pinned = pinned;
  }
  
  return this.find(query)
    .sort({ is_pinned: -1, updated_at: -1 })
    .skip(skip)
    .limit(limit);
};

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
