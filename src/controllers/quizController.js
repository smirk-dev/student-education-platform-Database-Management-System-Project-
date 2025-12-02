/**
 * Quiz Controller
 * 
 * Handles quiz operations using MySQL
 */

const mysqlPool = require('../config/mysql');

/**
 * Get all quizzes for a course
 */
const getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const [quizzes] = await mysqlPool.query(
      `SELECT q.*, c.course_name, c.course_code,
              (SELECT COUNT(*) FROM quiz_submissions WHERE quiz_id = q.quiz_id) as total_submissions
       FROM quizzes q
       JOIN courses c ON q.course_id = c.course_id
       WHERE q.course_id = ?
       ORDER BY q.created_at DESC`,
      [courseId]
    );
    
    res.json({
      success: true,
      message: 'Quizzes retrieved successfully',
      data: {
        quizzes,
        count: quizzes.length,
        database: 'MySQL'
      }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quizzes',
      error: error.message
    });
  }
};

/**
 * Get single quiz details
 */
const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const [quizzes] = await mysqlPool.query(
      `SELECT q.*, c.course_name, c.course_code, u.name as instructor_name
       FROM quizzes q
       JOIN courses c ON q.course_id = c.course_id
       JOIN users u ON c.instructor_id = u.user_id
       WHERE q.quiz_id = ?`,
      [quizId]
    );
    
    if (quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Get student's submission if exists
    if (req.user.role === 'student') {
      const [submissions] = await mysqlPool.query(
        `SELECT * FROM quiz_submissions 
         WHERE quiz_id = ? AND student_id = ?`,
        [quizId, req.user.user_id]
      );
      
      quizzes[0].my_submission = submissions[0] || null;
    }
    
    res.json({
      success: true,
      message: 'Quiz retrieved successfully',
      data: {
        quiz: quizzes[0],
        database: 'MySQL'
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quiz',
      error: error.message
    });
  }
};

/**
 * Submit quiz answers
 */
const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    
    if (!answers) {
      return res.status(400).json({
        success: false,
        message: 'Quiz answers are required'
      });
    }
    
    // Check if already submitted
    const [existing] = await mysqlPool.query(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [quizId, req.user.user_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this quiz'
      });
    }
    
    // Get quiz details for scoring
    const [quizzes] = await mysqlPool.query(
      'SELECT * FROM quizzes WHERE quiz_id = ?',
      [quizId]
    );
    
    if (quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    const quiz = quizzes[0];
    
    // Calculate score (simplified - in real app, would compare with correct answers)
    const score = Math.floor(Math.random() * 30) + 70; // Demo: random score 70-100
    
    // Insert submission
    const [result] = await mysqlPool.query(
      `INSERT INTO quiz_submissions 
       (quiz_id, student_id, score, submitted_at) 
       VALUES (?, ?, ?, NOW())`,
      [quizId, req.user.user_id, score]
    );
    
    // Get the inserted submission
    const [submissions] = await mysqlPool.query(
      `SELECT qs.*, q.title as quiz_title, q.max_score,
              u.name as student_name, c.course_name
       FROM quiz_submissions qs
       JOIN quizzes q ON qs.quiz_id = q.quiz_id
       JOIN users u ON qs.student_id = u.user_id
       JOIN courses c ON q.course_id = c.course_id
       WHERE qs.submission_id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        submission: submissions[0],
        database: 'MySQL'
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
};

/**
 * Get student's quiz submissions
 */
const getMySubmissions = async (req, res) => {
  try {
    const [submissions] = await mysqlPool.query(
      `SELECT qs.*, q.title as quiz_title, q.max_score,
              c.course_name, c.course_code
       FROM quiz_submissions qs
       JOIN quizzes q ON qs.quiz_id = q.quiz_id
       JOIN courses c ON q.course_id = c.course_id
       WHERE qs.student_id = ?
       ORDER BY qs.submitted_at DESC`,
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      message: 'Your submissions retrieved successfully',
      data: {
        submissions,
        count: submissions.length,
        database: 'MySQL'
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve submissions',
      error: error.message
    });
  }
};

/**
 * Get quiz statistics (instructor)
 */
const getQuizStats = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const [stats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as total_submissions,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        q.max_score
       FROM quiz_submissions qs
       JOIN quizzes q ON qs.quiz_id = q.quiz_id
       WHERE qs.quiz_id = ?
       GROUP BY q.max_score`,
      [quizId]
    );
    
    // Get score distribution
    const [distribution] = await mysqlPool.query(
      `SELECT 
        CASE 
          WHEN score >= 90 THEN 'A (90-100)'
          WHEN score >= 80 THEN 'B (80-89)'
          WHEN score >= 70 THEN 'C (70-79)'
          WHEN score >= 60 THEN 'D (60-69)'
          ELSE 'F (0-59)'
        END as grade,
        COUNT(*) as count
       FROM quiz_submissions
       WHERE quiz_id = ?
       GROUP BY grade
       ORDER BY grade`,
      [quizId]
    );
    
    res.json({
      success: true,
      message: 'Quiz statistics retrieved successfully',
      data: {
        stats: stats[0] || null,
        distribution,
        database: 'MySQL with Aggregation'
      }
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quiz statistics',
      error: error.message
    });
  }
};

module.exports = {
  getCourseQuizzes,
  getQuizById,
  submitQuiz,
  getMySubmissions,
  getQuizStats
};
