/**
 * ACTIVITY LOG MODEL (MongoDB)
 * 
 * Purpose: Track all user activities across the platform for analytics and auditing
 * Why MongoDB?: Activity logs are high-volume, write-heavy data that benefit from
 * MongoDB's flexible schema and fast writes. No complex relationships needed.
 * 
 * Design Decision: Time-series like collection optimized for inserts and time-based queries.
 * Metadata field allows for flexible additional information without schema changes.
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    index: true,
    // References MySQL users.user_id
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'REGISTER',
      'VIEW_COURSE',
      'ENROLL_COURSE',
      'DROP_COURSE',
      'CREATE_COURSE',
      'UPDATE_COURSE',
      'DELETE_COURSE',
      'VIEW_QUIZ',
      'SUBMIT_QUIZ',
      'CREATE_QUIZ',
      'GRADE_QUIZ',
      'VIEW_ASSIGNMENT',
      'SUBMIT_ASSIGNMENT',
      'CREATE_ASSIGNMENT',
      'GRADE_ASSIGNMENT',
      'CREATE_DISCUSSION',
      'POST_COMMENT',
      'EDIT_COMMENT',
      'DELETE_COMMENT',
      'VIEW_DASHBOARD',
      'UPDATE_PROFILE',
      'CHANGE_PASSWORD'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  course_id: {
    type: Number,
    // Optional - only for course-related actions
  },
  resource_type: {
    type: String,
    enum: ['course', 'quiz', 'assignment', 'discussion', 'user', 'enrollment', null],
    default: null
  },
  resource_id: {
    type: mongoose.Schema.Types.Mixed,
    // Can be a number (for MySQL IDs) or ObjectId (for MongoDB docs)
  },
  metadata: {
    ip_address: {
      type: String,
      trim: true
    },
    user_agent: {
      type: String,
      trim: true
    },
    browser: {
      type: String,
      trim: true
    },
    os: {
      type: String,
      trim: true
    },
    device_type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    location: {
      country: String,
      city: String
    },
    additional_data: {
      type: mongoose.Schema.Types.Mixed
      // Flexible field for any additional context
    }
  },
  success: {
    type: Boolean,
    default: true
  },
  error_message: {
    type: String,
    trim: true
  }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'activity_logs'
});

// Compound indexes for common queries
activityLogSchema.index({ user_id: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ course_id: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 }); // For recent activity queries
activityLogSchema.index({ user_id: 1, action: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 1 year (optional)
// Uncomment if you want automatic cleanup
// activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Static method to log an activity
activityLogSchema.statics.logActivity = async function(logData) {
  const log = new this({
    user_id: logData.user_id,
    action: logData.action,
    timestamp: new Date(),
    course_id: logData.course_id,
    resource_type: logData.resource_type,
    resource_id: logData.resource_id,
    metadata: logData.metadata || {},
    success: logData.success !== undefined ? logData.success : true,
    error_message: logData.error_message
  });
  
  return await log.save();
};

// Static method to get user activity history
activityLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    action = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { user_id: userId };
  
  if (action) {
    query.action = action;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get course activity
activityLogSchema.statics.getCourseActivity = function(courseId, options = {}) {
  const {
    limit = 100,
    skip = 0,
    action = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { course_id: courseId };
  
  if (action) {
    query.action = action;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get recent activity (global)
activityLogSchema.statics.getRecentActivity = function(options = {}) {
  const { limit = 100, action = null } = options;
  
  const query = {};
  if (action) {
    query.action = action;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get activity statistics
activityLogSchema.statics.getStatistics = async function(options = {}) {
  const {
    userId = null,
    courseId = null,
    startDate = null,
    endDate = null
  } = options;
  
  const matchStage = {};
  
  if (userId) matchStage.user_id = userId;
  if (courseId) matchStage.course_id = courseId;
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get daily activity counts (for charts)
activityLogSchema.statics.getDailyActivity = async function(days = 30, userId = null) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchStage = {
    timestamp: { $gte: startDate }
  };
  
  if (userId) {
    matchStage.user_id = userId;
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 },
        actions: { $push: '$action' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get popular courses (based on activity)
activityLogSchema.statics.getPopularCourses = async function(limit = 10, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        course_id: { $exists: true, $ne: null },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$course_id',
        activity_count: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
        actions: { $push: '$action' }
      }
    },
    {
      $project: {
        course_id: '$_id',
        activity_count: 1,
        unique_user_count: { $size: '$unique_users' },
        _id: 0
      }
    },
    { $sort: { activity_count: -1 } },
    { $limit: limit }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get active users (based on recent activity)
activityLogSchema.statics.getActiveUsers = async function(days = 7, limit = 20) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$user_id',
        activity_count: { $sum: 1 },
        last_activity: { $max: '$timestamp' },
        actions: { $push: '$action' }
      }
    },
    { $sort: { activity_count: -1 } },
    { $limit: limit }
  ];
  
  return await this.aggregate(pipeline);
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
