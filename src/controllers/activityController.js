/**
 * Activity Controller
 * 
 * Handles user activity logs and statistics from MongoDB
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Get user's activity logs
 */
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 50;
    
    const activities = await ActivityLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      message: 'Activity logs retrieved successfully',
      data: {
        activities,
        count: activities.length,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  }
};

/**
 * Get user activity statistics
 */
const getUserActivityStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Get activity counts by action type
    const actionStats = await ActivityLog.aggregate([
      { $match: { user_id: userId } },
      { 
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent activity by date
    const recentActivity = await ActivityLog.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);
    
    // Get device usage
    const deviceStats = await ActivityLog.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: '$metadata.device_type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total activity count
    const totalActivities = await ActivityLog.countDocuments({ user_id: userId });
    
    res.json({
      success: true,
      message: 'Activity statistics retrieved successfully',
      data: {
        total_activities: totalActivities,
        by_action: actionStats,
        recent_daily: recentActivity,
        by_device: deviceStats,
        database: 'MongoDB - Aggregation Pipeline'
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity statistics',
      error: error.message
    });
  }
};

/**
 * Get course activity (instructor/admin only)
 */
const getCourseActivity = async (req, res) => {
  try {
    const { courseId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const activities = await ActivityLog.find({ course_id: parseInt(courseId) })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      message: 'Course activity retrieved successfully',
      data: {
        activities,
        count: activities.length,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get course activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course activity',
      error: error.message
    });
  }
};

/**
 * Get platform statistics (admin only)
 */
const getPlatformStats = async (req, res) => {
  try {
    const mysqlPool = require('../config/mysql');
    
    // Get MySQL stats
    const [userStats] = await mysqlPool.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    
    const [courseStats] = await mysqlPool.query(
      'SELECT COUNT(*) as total_courses FROM courses'
    );
    
    const [enrollmentStats] = await mysqlPool.query(
      'SELECT COUNT(*) as total_enrollments FROM enrollments'
    );
    
    const [quizStats] = await mysqlPool.query(
      'SELECT COUNT(*) as total_quizzes FROM quizzes'
    );
    
    const [submissionStats] = await mysqlPool.query(
      'SELECT COUNT(*) as total_submissions FROM quiz_submissions'
    );
    
    // Get MongoDB stats
    const totalActivities = await ActivityLog.countDocuments();
    const Discussion = require('../models/Discussion');
    const Assignment = require('../models/Assignment');
    
    const totalDiscussions = await Discussion.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    
    // Get recent activity trend
    const activityTrend = await ActivityLog.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    res.json({
      success: true,
      message: 'Platform statistics retrieved successfully',
      data: {
        mysql_stats: {
          users: userStats,
          courses: courseStats[0].total_courses,
          enrollments: enrollmentStats[0].total_enrollments,
          quizzes: quizStats[0].total_quizzes,
          quiz_submissions: submissionStats[0].total_submissions,
          database: 'MySQL'
        },
        mongodb_stats: {
          activity_logs: totalActivities,
          discussions: totalDiscussions,
          assignments: totalAssignments,
          activity_trend: activityTrend,
          database: 'MongoDB'
        }
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform statistics',
      error: error.message
    });
  }
};

module.exports = {
  getUserActivity,
  getUserActivityStats,
  getCourseActivity,
  getPlatformStats
};
