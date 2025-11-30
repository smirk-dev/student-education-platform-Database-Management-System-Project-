-- ============================================
-- SAMPLE SQL QUERIES FOR DEMONSTRATION
-- ============================================
-- These queries demonstrate key DBMS concepts:
-- JOINs, Aggregations, Subqueries, Views, etc.
-- ============================================

USE student_portal;

-- ============================================
-- 1. USER QUERIES
-- ============================================

-- Get all students
SELECT user_id, name, email, created_at 
FROM users 
WHERE role = 'student'
ORDER BY name;

-- Get all instructors with course count
SELECT 
    u.user_id,
    u.name,
    u.email,
    COUNT(c.course_id) as total_courses
FROM users u
LEFT JOIN courses c ON u.user_id = c.instructor_id
WHERE u.role = 'instructor'
GROUP BY u.user_id, u.name, u.email
ORDER BY total_courses DESC;

-- ============================================
-- 2. COURSE QUERIES
-- ============================================

-- Get all courses with instructor details
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    c.description,
    u.name as instructor_name,
    u.email as instructor_email,
    c.created_at
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
ORDER BY c.course_code;

-- Get course with enrollment count
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    u.name as instructor_name,
    COUNT(e.enrollment_id) as total_students
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
GROUP BY c.course_id, c.course_code, c.course_name, u.name
ORDER BY total_students DESC;

-- ============================================
-- 3. ENROLLMENT QUERIES
-- ============================================

-- Get all enrollments for a specific student (student_id = 4)
SELECT 
    e.enrollment_id,
    c.course_code,
    c.course_name,
    u.name as instructor_name,
    e.enrolled_at,
    e.status
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.course_id
INNER JOIN users u ON c.instructor_id = u.user_id
WHERE e.student_id = 4
ORDER BY e.enrolled_at DESC;

-- Get all students enrolled in a specific course (course_id = 3)
SELECT 
    u.user_id,
    u.name,
    u.email,
    e.enrolled_at,
    e.status
FROM enrollments e
INNER JOIN users u ON e.student_id = u.user_id
WHERE e.course_id = 3 AND e.status = 'active'
ORDER BY u.name;

-- Find courses a student is NOT enrolled in (student_id = 4)
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    u.name as instructor_name
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
WHERE c.course_id NOT IN (
    SELECT course_id 
    FROM enrollments 
    WHERE student_id = 4
)
ORDER BY c.course_code;

-- ============================================
-- 4. QUIZ QUERIES
-- ============================================

-- Get all quizzes for a specific course
SELECT 
    q.quiz_id,
    q.title,
    q.description,
    q.max_marks,
    q.due_date,
    q.is_active,
    COUNT(qs.submission_id) as total_submissions
FROM quizzes q
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id
WHERE q.course_id = 3
GROUP BY q.quiz_id, q.title, q.description, q.max_marks, q.due_date, q.is_active
ORDER BY q.due_date;

-- Get upcoming quizzes (not yet due)
SELECT 
    q.quiz_id,
    c.course_code,
    c.course_name,
    q.title,
    q.max_marks,
    q.due_date
FROM quizzes q
INNER JOIN courses c ON q.course_id = c.course_id
WHERE q.due_date > NOW() AND q.is_active = TRUE
ORDER BY q.due_date ASC;

-- ============================================
-- 5. QUIZ SUBMISSION QUERIES
-- ============================================

-- Get all submissions for a specific quiz with student details
SELECT 
    qs.submission_id,
    u.name as student_name,
    u.email,
    qs.marks_obtained,
    q.max_marks,
    ROUND((qs.marks_obtained / q.max_marks) * 100, 2) as percentage,
    qs.submitted_at,
    qs.graded_at
FROM quiz_submissions qs
INNER JOIN users u ON qs.student_id = u.user_id
INNER JOIN quizzes q ON qs.quiz_id = q.quiz_id
WHERE qs.quiz_id = 3
ORDER BY qs.marks_obtained DESC;

-- Get a student's quiz performance across all courses (student_id = 5)
SELECT 
    c.course_code,
    c.course_name,
    q.title as quiz_title,
    qs.marks_obtained,
    q.max_marks,
    ROUND((qs.marks_obtained / q.max_marks) * 100, 2) as percentage,
    qs.submitted_at
FROM quiz_submissions qs
INNER JOIN quizzes q ON qs.quiz_id = q.quiz_id
INNER JOIN courses c ON q.course_id = c.course_id
WHERE qs.student_id = 5
ORDER BY qs.submitted_at DESC;

-- ============================================
-- 6. AGGREGATION QUERIES
-- ============================================

-- Calculate average marks per quiz
SELECT 
    q.quiz_id,
    c.course_code,
    q.title,
    q.max_marks,
    COUNT(qs.submission_id) as total_submissions,
    ROUND(AVG(qs.marks_obtained), 2) as avg_marks,
    ROUND(AVG((qs.marks_obtained / q.max_marks) * 100), 2) as avg_percentage,
    MIN(qs.marks_obtained) as min_marks,
    MAX(qs.marks_obtained) as max_marks
FROM quizzes q
INNER JOIN courses c ON q.course_id = c.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id
GROUP BY q.quiz_id, c.course_code, q.title, q.max_marks
HAVING COUNT(qs.submission_id) > 0
ORDER BY c.course_code, q.quiz_id;

-- Calculate overall performance per student
SELECT 
    u.user_id,
    u.name,
    u.email,
    COUNT(DISTINCT e.course_id) as courses_enrolled,
    COUNT(qs.submission_id) as quizzes_submitted,
    ROUND(AVG((qs.marks_obtained / q.max_marks) * 100), 2) as overall_avg_percentage
FROM users u
LEFT JOIN enrollments e ON u.user_id = e.student_id AND e.status = 'active'
LEFT JOIN quiz_submissions qs ON u.user_id = qs.student_id
LEFT JOIN quizzes q ON qs.quiz_id = q.quiz_id
WHERE u.role = 'student'
GROUP BY u.user_id, u.name, u.email
ORDER BY overall_avg_percentage DESC;

-- Calculate course statistics
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    u.name as instructor_name,
    COUNT(DISTINCT e.student_id) as enrolled_students,
    COUNT(DISTINCT q.quiz_id) as total_quizzes,
    COUNT(qs.submission_id) as total_submissions,
    ROUND(AVG((qs.marks_obtained / q.max_marks) * 100), 2) as avg_performance
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
LEFT JOIN quizzes q ON c.course_id = q.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id
GROUP BY c.course_id, c.course_code, c.course_name, u.name
ORDER BY enrolled_students DESC;

-- ============================================
-- 7. COMPLEX QUERIES WITH SUBQUERIES
-- ============================================

-- Find students who scored above average in a specific quiz (quiz_id = 3)
SELECT 
    u.name,
    qs.marks_obtained,
    q.max_marks,
    ROUND((qs.marks_obtained / q.max_marks) * 100, 2) as percentage
FROM quiz_submissions qs
INNER JOIN users u ON qs.student_id = u.user_id
INNER JOIN quizzes q ON qs.quiz_id = q.quiz_id
WHERE qs.quiz_id = 3
    AND qs.marks_obtained > (
        SELECT AVG(marks_obtained)
        FROM quiz_submissions
        WHERE quiz_id = 3
    )
ORDER BY qs.marks_obtained DESC;

-- Find courses with above-average enrollment
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    COUNT(e.enrollment_id) as student_count
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
GROUP BY c.course_id, c.course_code, c.course_name
HAVING COUNT(e.enrollment_id) > (
    SELECT AVG(enrollment_count)
    FROM (
        SELECT COUNT(*) as enrollment_count
        FROM enrollments
        WHERE status = 'active'
        GROUP BY course_id
    ) as avg_calc
)
ORDER BY student_count DESC;

-- ============================================
-- 8. USEFUL VIEWS
-- ============================================

-- View: Student course summary
CREATE OR REPLACE VIEW student_course_summary AS
SELECT 
    u.user_id as student_id,
    u.name as student_name,
    u.email as student_email,
    c.course_id,
    c.course_code,
    c.course_name,
    i.name as instructor_name,
    e.enrolled_at,
    e.status as enrollment_status,
    COUNT(DISTINCT q.quiz_id) as total_quizzes,
    COUNT(DISTINCT qs.submission_id) as quizzes_submitted,
    ROUND(AVG((qs.marks_obtained / q.max_marks) * 100), 2) as avg_percentage
FROM users u
INNER JOIN enrollments e ON u.user_id = e.student_id
INNER JOIN courses c ON e.course_id = c.course_id
INNER JOIN users i ON c.instructor_id = i.user_id
LEFT JOIN quizzes q ON c.course_id = q.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id AND qs.student_id = u.user_id
WHERE u.role = 'student'
GROUP BY u.user_id, u.name, u.email, c.course_id, c.course_code, 
         c.course_name, i.name, e.enrolled_at, e.status;

-- View: Course performance overview
CREATE OR REPLACE VIEW course_performance_overview AS
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    u.name as instructor_name,
    COUNT(DISTINCT e.student_id) as enrolled_students,
    COUNT(DISTINCT q.quiz_id) as total_quizzes,
    COUNT(qs.submission_id) as total_submissions,
    ROUND(AVG(qs.marks_obtained), 2) as avg_marks,
    ROUND(AVG((qs.marks_obtained / q.max_marks) * 100), 2) as avg_percentage
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
LEFT JOIN quizzes q ON c.course_id = q.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id
GROUP BY c.course_id, c.course_code, c.course_name, u.name;

-- ============================================
-- 9. TRANSACTION EXAMPLES
-- ============================================

-- Example: Enroll a student in a course (with error handling)
DELIMITER //
CREATE PROCEDURE enroll_student(
    IN p_student_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if student exists and is actually a student
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_student_id AND role = 'student') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid student ID';
    END IF;
    
    -- Check if course exists
    IF NOT EXISTS (SELECT 1 FROM courses WHERE course_id = p_course_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid course ID';
    END IF;
    
    -- Check if already enrolled
    IF EXISTS (SELECT 1 FROM enrollments WHERE student_id = p_student_id AND course_id = p_course_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student already enrolled in this course';
    END IF;
    
    -- Insert enrollment
    INSERT INTO enrollments (student_id, course_id) VALUES (p_student_id, p_course_id);
    
    COMMIT;
END //
DELIMITER ;

-- ============================================
-- 10. QUERIES TO TEST REFERENTIAL INTEGRITY
-- ============================================

-- These will fail due to foreign key constraints:

-- Cannot delete a user who is an instructor with courses
-- DELETE FROM users WHERE user_id = 2;

-- Cannot delete a course with enrollments
-- DELETE FROM courses WHERE course_id = 1;

-- Cannot insert enrollment with non-existent student
-- INSERT INTO enrollments (student_id, course_id) VALUES (999, 1);

-- ============================================
-- END OF SAMPLE QUERIES
-- ============================================
