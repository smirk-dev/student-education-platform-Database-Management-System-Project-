-- ============================================
-- HYBRID STUDENT LEARNING PORTAL
-- MySQL Database Schema
-- ============================================
-- This schema handles structured, relational data:
-- Users, Courses, Enrollments, Quizzes, and Quiz Submissions
-- ============================================

-- Drop existing database if exists and create fresh
DROP DATABASE IF EXISTS student_portal;
CREATE DATABASE student_portal;
USE student_portal;

-- ============================================
-- TABLE: users
-- Purpose: Store all system users (students, instructors, admins)
-- ============================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: courses
-- Purpose: Store course information
-- ============================================
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(200) NOT NULL,
    description TEXT,
    instructor_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id),
    INDEX idx_course_code (course_code)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: enrollments
-- Purpose: Many-to-many relationship between students and courses
-- ============================================
CREATE TABLE enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student (student_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: quizzes
-- Purpose: Store quiz information for each course
-- ============================================
CREATE TABLE quizzes (
    quiz_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    max_marks INT NOT NULL DEFAULT 100,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: quiz_submissions
-- Purpose: Store student quiz submissions and marks
-- ============================================
CREATE TABLE quiz_submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained INT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    feedback TEXT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (quiz_id, student_id),
    INDEX idx_quiz (quiz_id),
    INDEX idx_student (student_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample users
-- Password for all users: 'password123' (hashed with bcrypt)
INSERT INTO users (name, email, password_hash, role) VALUES
('John Admin', 'admin@university.edu', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'admin'),
('Dr. Divya Mishra', 'divya.mishra@ddn.upes.ac.in', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'instructor'),
('Dr. Neelu Jyoti Ahuja', 'neelu.ahuja@ddn.upes.ac.in', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'instructor'),
('Alice Smith', 'alice.smith@student.edu', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'student'),
('Bob Williams', 'bob.williams@student.edu', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'student'),
('Carol Davis', 'carol.davis@student.edu', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'student'),
('David Brown', 'david.brown@student.edu', '$2a$10$rZqVvXaYCGv0v0Y1Y7IYVO5UqKlZqYyqBQfZx8kKl0z1x2z3z4z5z', 'student');

-- Insert sample courses
INSERT INTO courses (course_code, course_name, description, instructor_id) VALUES
('CS101', 'Introduction to Computer Science', 'Fundamentals of programming and computer science concepts', 2),
('CS201', 'Data Structures and Algorithms', 'Advanced data structures, algorithm design and analysis', 2),
('CS301', 'Database Management Systems', 'Relational and NoSQL databases, SQL, normalization, transactions', 3),
('CS401', 'Web Development', 'Full-stack web development with modern frameworks', 3);

-- Insert sample enrollments
INSERT INTO enrollments (student_id, course_id, status) VALUES
(4, 1, 'active'), -- Alice in CS101
(4, 3, 'active'), -- Alice in CS301
(5, 1, 'active'), -- Bob in CS101
(5, 2, 'active'), -- Bob in CS201
(5, 3, 'active'), -- Bob in CS301
(6, 2, 'active'), -- Carol in CS201
(6, 4, 'active'), -- Carol in CS401
(7, 1, 'active'), -- David in CS101
(7, 3, 'active'); -- David in CS301

-- Insert sample quizzes
INSERT INTO quizzes (course_id, title, description, max_marks, due_date) VALUES
(1, 'Quiz 1: Programming Basics', 'Variables, data types, and control structures', 50, '2025-12-15 23:59:59'),
(1, 'Quiz 2: Functions and Arrays', 'Understanding functions and array manipulation', 50, '2025-12-20 23:59:59'),
(3, 'Quiz 1: SQL Fundamentals', 'SELECT, JOIN, and basic query writing', 100, '2025-12-18 23:59:59'),
(3, 'Quiz 2: Normalization', 'Database normalization and design principles', 100, '2025-12-25 23:59:59'),
(2, 'Quiz 1: Complexity Analysis', 'Big-O notation and algorithm analysis', 75, '2025-12-22 23:59:59');

-- Insert sample quiz submissions
INSERT INTO quiz_submissions (quiz_id, student_id, marks_obtained, submitted_at, graded_at) VALUES
(1, 4, 45, '2025-12-14 18:30:00', '2025-12-15 10:00:00'),
(1, 5, 38, '2025-12-14 20:15:00', '2025-12-15 10:00:00'),
(1, 7, 42, '2025-12-15 09:00:00', '2025-12-15 11:00:00'),
(3, 4, 85, '2025-12-17 14:20:00', '2025-12-18 09:00:00'),
(3, 5, 92, '2025-12-17 16:45:00', '2025-12-18 09:00:00'),
(3, 7, 78, '2025-12-18 10:30:00', '2025-12-18 15:00:00'),
(5, 5, 68, '2025-12-21 19:00:00', '2025-12-22 08:00:00'),
(5, 6, 71, '2025-12-21 21:30:00', '2025-12-22 08:00:00');

-- ============================================
-- END OF SCHEMA CREATION
-- ============================================
