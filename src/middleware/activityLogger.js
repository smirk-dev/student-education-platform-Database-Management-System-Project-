/**
 * Activity Logger Middleware
 * 
 * Logs user activities to MongoDB
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Extract client information from request
 */
const extractMetadata = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Simple device type detection
  let deviceType = 'desktop';
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }
  
  // Simple browser detection
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Simple OS detection
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return {
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: userAgent,
    browser,
    os,
    device_type: deviceType
  };
};

/**
 * Log activity middleware
 */
const logActivity = (action, options = {}) => {
  return async (req, res, next) => {
    // Save original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    res.json = async (data) => {
      try {
        // Only log if user is authenticated
        if (req.user && req.user.user_id) {
          const logData = {
            user_id: req.user.user_id,
            action: action,
            success: res.statusCode < 400,
            metadata: extractMetadata(req)
          };
          
          // Add course_id if available
          if (req.params.courseId) {
            logData.course_id = parseInt(req.params.courseId);
          } else if (req.body.course_id) {
            logData.course_id = parseInt(req.body.course_id);
          }
          
          // Add resource information
          if (options.resourceType) {
            logData.resource_type = options.resourceType;
          }
          if (req.params.id) {
            logData.resource_id = req.params.id;
          }
          
          // Add additional metadata
          if (options.additionalData) {
            logData.metadata.additional_data = 
              typeof options.additionalData === 'function'
                ? options.additionalData(req, data)
                : options.additionalData;
          }
          
          // Log asynchronously without blocking response
          ActivityLog.logActivity(logData).catch(err => {
            console.error('Activity logging error:', err.message);
          });
        }
      } catch (error) {
        console.error('Activity logger error:', error.message);
      }
      
      // Send original response
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Manually log activity (for use in controllers)
 */
const logManualActivity = async (userId, action, options = {}) => {
  try {
    const logData = {
      user_id: userId,
      action: action,
      success: options.success !== undefined ? options.success : true,
      course_id: options.course_id,
      resource_type: options.resource_type,
      resource_id: options.resource_id,
      error_message: options.error_message,
      metadata: options.metadata || {}
    };
    
    await ActivityLog.logActivity(logData);
  } catch (error) {
    console.error('Manual activity logging error:', error.message);
  }
};

module.exports = {
  logActivity,
  logManualActivity,
  extractMetadata
};
