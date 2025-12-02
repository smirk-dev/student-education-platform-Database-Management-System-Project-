/**
 * Assignment Controller
 * 
 * Handles assignment operations using MongoDB
 */

const Assignment = require('../models/Assignment');

/**
 * Get all assignments for a course
 */
const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const assignments = await Assignment.find({ course_id: parseInt(courseId) })
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: {
        assignments,
        count: assignments.length,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignments',
      error: error.message
    });
  }
};

/**
 * Get student's assignments
 */
const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    
    const assignments = await Assignment.find({ student_id: studentId })
      .sort({ submitted_at: -1 });
    
    res.json({
      success: true,
      message: 'Your assignments retrieved successfully',
      data: {
        assignments,
        count: assignments.length,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignments',
      error: error.message
    });
  }
};

/**
 * Get single assignment by ID
 */
const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Check if user has access
    if (req.user.role === 'student' && assignment.student_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: {
        assignment,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment',
      error: error.message
    });
  }
};

/**
 * Submit new assignment
 */
const submitAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, submission_type, submission_content } = req.body;
    
    if (!title || !submission_type || !submission_content) {
      return res.status(400).json({
        success: false,
        message: 'Title, submission type, and content are required'
      });
    }
    
    const assignmentData = {
      course_id: parseInt(courseId),
      student_id: req.user.user_id,
      student_name: req.user.name,
      title,
      description,
      submission_type,
      submission_content
    };
    
    const assignment = await Assignment.submitAssignment(assignmentData);
    
    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        assignment,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      error: error.message
    });
  }
};

/**
 * Grade assignment (instructor only)
 */
const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { score, max_score, feedback, rubric } = req.body;
    
    if (score === undefined || !max_score) {
      return res.status(400).json({
        success: false,
        message: 'Score and max_score are required'
      });
    }
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    assignment.gradeAssignment(
      req.user.user_id,
      req.user.name,
      score,
      max_score,
      feedback,
      rubric
    );
    
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Assignment graded successfully',
      data: {
        assignment,
        database: 'MongoDB'
      }
    });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade assignment',
      error: error.message
    });
  }
};

/**
 * Get assignment statistics for course
 */
const getAssignmentStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const stats = await Assignment.getSubmissionStats(parseInt(courseId));
    
    res.json({
      success: true,
      message: 'Assignment statistics retrieved',
      data: {
        stats,
        database: 'MongoDB - Aggregation Pipeline'
      }
    });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
};

module.exports = {
  getCourseAssignments,
  getStudentAssignments,
  getAssignmentById,
  submitAssignment,
  gradeAssignment,
  getAssignmentStats
};
