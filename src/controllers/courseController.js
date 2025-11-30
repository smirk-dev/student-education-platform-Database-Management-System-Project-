/**
 * Course Controller
 * 
 * Handles course and enrollment management
 * Uses MySQL for relational data and MongoDB for activity logging
 */

const { executeQuery, executeTransaction } = require('../config/mysql');
const { logManualActivity } = require('../middleware/activityLogger');

/**
 * Get all courses
 * GET /api/courses
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await executeQuery(`
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.description,
        c.created_at,
        u.name as instructor_name,
        u.email as instructor_email,
        COUNT(DISTINCT e.enrollment_id) as enrolled_students
      FROM courses c
      INNER JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
      GROUP BY c.course_id, c.course_code, c.course_name, c.description, 
               c.created_at, u.name, u.email
      ORDER BY c.course_code
    `);
    
    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses',
      error: error.message
    });
  }
};

/**
 * Get course by ID
 * GET /api/courses/:id
 */
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Get course details with instructor info
    const courses = await executeQuery(`
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.description,
        c.created_at,
        c.instructor_id,
        u.name as instructor_name,
        u.email as instructor_email,
        COUNT(DISTINCT e.enrollment_id) as enrolled_students
      FROM courses c
      INNER JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
      WHERE c.course_id = ?
      GROUP BY c.course_id, c.course_code, c.course_name, c.description, 
               c.created_at, c.instructor_id, u.name, u.email
    `, [courseId]);
    
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const course = courses[0];
    
    // Check if current user is enrolled (if authenticated)
    if (req.user && req.user.role === 'student') {
      const enrollments = await executeQuery(
        'SELECT enrollment_id, status FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.user_id, courseId]
      );
      
      course.is_enrolled = enrollments.length > 0;
      course.enrollment_status = enrollments.length > 0 ? enrollments[0].status : null;
    }
    
    // Get quiz count
    const quizzes = await executeQuery(
      'SELECT COUNT(*) as count FROM quizzes WHERE course_id = ?',
      [courseId]
    );
    course.total_quizzes = quizzes[0].count;
    
    // Log view activity
    if (req.user) {
      await logManualActivity(req.user.user_id, 'VIEW_COURSE', {
        course_id: parseInt(courseId),
        resource_type: 'course',
        resource_id: courseId
      });
    }
    
    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course',
      error: error.message
    });
  }
};

/**
 * Create new course
 * POST /api/courses
 * Requires: instructor or admin role
 */
const createCourse = async (req, res) => {
  try {
    const { course_code, course_name, description } = req.body;
    const instructorId = req.user.user_id;
    
    // Validation
    if (!course_code || !course_name) {
      return res.status(400).json({
        success: false,
        message: 'Course code and name are required'
      });
    }
    
    // Check if course code already exists
    const existing = await executeQuery(
      'SELECT course_id FROM courses WHERE course_code = ?',
      [course_code]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Course code already exists'
      });
    }
    
    // Insert course
    const result = await executeQuery(
      'INSERT INTO courses (course_code, course_name, description, instructor_id) VALUES (?, ?, ?, ?)',
      [course_code, course_name, description || null, instructorId]
    );
    
    const courseId = result.insertId;
    
    // Get created course
    const courses = await executeQuery(`
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.description,
        c.created_at,
        u.name as instructor_name,
        u.email as instructor_email
      FROM courses c
      INNER JOIN users u ON c.instructor_id = u.user_id
      WHERE c.course_id = ?
    `, [courseId]);
    
    // Log activity
    await logManualActivity(instructorId, 'CREATE_COURSE', {
      course_id: courseId,
      resource_type: 'course',
      resource_id: courseId
    });
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course: courses[0] }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
};

/**
 * Get student's enrolled courses
 * GET /api/courses/my-courses
 */
const getMyEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    
    const courses = await executeQuery(`
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.description,
        u.name as instructor_name,
        u.email as instructor_email,
        e.enrolled_at,
        e.status as enrollment_status,
        COUNT(DISTINCT q.quiz_id) as total_quizzes,
        COUNT(DISTINCT qs.submission_id) as quizzes_submitted
      FROM enrollments e
      INNER JOIN courses c ON e.course_id = c.course_id
      INNER JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN quizzes q ON c.course_id = q.course_id
      LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id AND qs.student_id = e.student_id
      WHERE e.student_id = ?
      GROUP BY c.course_id, c.course_code, c.course_name, c.description,
               u.name, u.email, e.enrolled_at, e.status
      ORDER BY e.enrolled_at DESC
    `, [studentId]);
    
    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enrolled courses',
      error: error.message
    });
  }
};

/**
 * Enroll in a course
 * POST /api/courses/:id/enroll
 * Requires: student role
 */
const enrollInCourse = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const courseId = req.params.id;
    
    // Check if course exists
    const courses = await executeQuery(
      'SELECT course_id, course_name FROM courses WHERE course_id = ?',
      [courseId]
    );
    
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if already enrolled
    const existing = await executeQuery(
      'SELECT enrollment_id, status FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Already ${existing[0].status} in this course`
      });
    }
    
    // Enroll student
    const result = await executeQuery(
      'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)',
      [studentId, courseId, 'active']
    );
    
    // Log activity
    await logManualActivity(studentId, 'ENROLL_COURSE', {
      course_id: parseInt(courseId),
      resource_type: 'enrollment',
      resource_id: result.insertId
    });
    
    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${courses[0].course_name}`,
      data: {
        enrollment_id: result.insertId,
        course_id: courseId,
        course_name: courses[0].course_name
      }
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message
    });
  }
};

/**
 * Get students enrolled in a course
 * GET /api/courses/:id/students
 * Requires: instructor or admin role
 */
const getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Verify course exists and user has access
    const courses = await executeQuery(
      'SELECT instructor_id FROM courses WHERE course_id = ?',
      [courseId]
    );
    
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check authorization (instructor can only see their own courses, admin can see all)
    if (req.user.role === 'instructor' && courses[0].instructor_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get enrolled students
    const students = await executeQuery(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        e.enrolled_at,
        e.status,
        COUNT(DISTINCT qs.submission_id) as quizzes_submitted,
        ROUND(AVG((qs.marks_obtained / q.max_marks) * 100), 2) as avg_percentage
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.user_id
      LEFT JOIN quiz_submissions qs ON u.user_id = qs.student_id
      LEFT JOIN quizzes q ON qs.quiz_id = q.quiz_id AND q.course_id = e.course_id
      WHERE e.course_id = ? AND e.status = 'active'
      GROUP BY u.user_id, u.name, u.email, e.enrolled_at, e.status
      ORDER BY u.name
    `, [courseId]);
    
    res.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course students',
      error: error.message
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  getMyEnrolledCourses,
  enrollInCourse,
  getCourseStudents
};
