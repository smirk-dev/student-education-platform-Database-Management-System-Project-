/**
 * Auth Controller
 * 
 * Handles user registration, login, and profile management
 * Uses MySQL for user data storage
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/mysql');
const { logManualActivity } = require('../middleware/activityLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Set default role to student if not provided
    const userRole = role && ['student', 'instructor', 'admin'].includes(role) 
      ? role 
      : 'student';
    
    // Insert user
    const result = await executeQuery(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, userRole]
    );
    
    const userId = result.insertId;
    
    // Get created user
    const users = await executeQuery(
      'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    const user = users[0];
    
    // Generate token
    const token = generateToken(user);
    
    // Log activity
    await logManualActivity(userId, 'REGISTER', {
      success: true,
      metadata: { role: userRole }
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const users = await executeQuery(
      'SELECT user_id, name, email, password_hash, role, created_at FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      await logManualActivity(user.user_id, 'LOGIN', {
        success: false,
        error_message: 'Invalid password'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Log successful login
    await logManualActivity(user.user_id, 'LOGIN', {
      success: true
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Get user details
    const users = await executeQuery(
      'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Get additional stats based on role
    let stats = {};
    
    if (user.role === 'student') {
      // Get enrollment count
      const enrollments = await executeQuery(
        'SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = ?',
        [userId, 'active']
      );
      
      // Get quiz submission count
      const quizzes = await executeQuery(
        'SELECT COUNT(*) as count FROM quiz_submissions WHERE student_id = ?',
        [userId]
      );
      
      stats = {
        enrolled_courses: enrollments[0].count,
        quizzes_submitted: quizzes[0].count
      };
    } else if (user.role === 'instructor') {
      // Get course count
      const courses = await executeQuery(
        'SELECT COUNT(*) as count FROM courses WHERE instructor_id = ?',
        [userId]
      );
      
      stats = {
        courses_teaching: courses[0].count
      };
    }
    
    res.json({
      success: true,
      data: {
        user,
        stats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    
    // Update user
    await executeQuery(
      'UPDATE users SET name = ? WHERE user_id = ?',
      [name.trim(), userId]
    );
    
    // Get updated user
    const users = await executeQuery(
      'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    // Log activity
    await logManualActivity(userId, 'UPDATE_PROFILE', { success: true });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Get current user with password
    const users = await executeQuery(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [userId]
    );
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await executeQuery(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [newPasswordHash, userId]
    );
    
    // Log activity
    await logManualActivity(userId, 'CHANGE_PASSWORD', { success: true });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
