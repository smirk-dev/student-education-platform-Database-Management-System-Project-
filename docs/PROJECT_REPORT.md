# Project Report: Hybrid Student Learning Portal

## Database Management Systems Course Project

---

## Table of Contents

1. [Abstract](#abstract)
2. [Introduction](#introduction)
3. [Problem Statement](#problem-statement)
4. [Objectives](#objectives)
5. [System Analysis](#system-analysis)
6. [System Design](#system-design)
7. [Database Design](#database-design)
8. [Implementation](#implementation)
9. [Testing](#testing)
10. [Results](#results)
11. [Challenges Faced](#challenges-faced)
12. [Future Scope](#future-scope)
13. [Conclusion](#conclusion)
14. [References](#references)

---

## 1. Abstract

The **Hybrid Student Learning Portal** is a web-based educational management system that demonstrates the concept of **polyglot persistence** by integrating both relational (MySQL) and NoSQL (MongoDB) databases within a unified application architecture. 

The system provides functionality for student enrollment, course management, quiz administration, discussion forums, and assignment submissions. By strategically utilizing MySQL for structured, transactional data and MongoDB for flexible, document-oriented data, the project showcases when and why different database paradigms should be employed in modern software systems.

**Keywords:** Polyglot Persistence, MySQL, MongoDB, Database Design, Student Management System, Hybrid Database Architecture

---

## 2. Introduction

### 2.1 Background

Modern web applications often require different types of data storage mechanisms. While relational databases excel at maintaining data integrity and complex relationships, NoSQL databases offer flexibility and performance for certain data patterns. This project explores the practical application of using both database types together.

### 2.2 Motivation

Traditional educational management systems typically rely on a single database type. This project was motivated by:
- The need to demonstrate real-world polyglot persistence patterns
- Understanding when to choose SQL vs NoSQL
- Applying theoretical DBMS concepts in a practical system
- Building a scalable, maintainable application architecture

### 2.3 Scope

The system covers:
- User authentication and role-based access control
- Course creation and enrollment management
- Quiz creation and submission tracking
- Discussion forums with nested comments (MongoDB)
- Assignment management with flexible submission types (MongoDB)
- Comprehensive activity logging (MongoDB)

---

## 3. Problem Statement

Educational institutions require robust systems to manage:
- Student enrollments and course registrations
- Assessment tracking (quizzes, assignments)
- Communication (discussions)
- Performance analytics

**Challenge:** Design a system that:
1. Maintains ACID properties for critical transactional data
2. Provides flexibility for varying content structures
3. Scales efficiently for high-volume operations
4. Demonstrates proper database design principles

---

## 4. Objectives

### 4.1 Primary Objectives

1. **Design a hybrid database system** using both MySQL and MongoDB
2. **Implement proper normalization** (3NF) in relational schema
3. **Demonstrate complex SQL queries** including JOINs, aggregations, and subqueries
4. **Utilize MongoDB features** like embedded documents and aggregation pipelines
5. **Build a full-stack application** with RESTful API architecture

### 4.2 Learning Objectives

- Apply database normalization techniques
- Implement foreign key constraints and referential integrity
- Design document schemas for MongoDB
- Create indexes for query optimization
- Handle cross-database referencing
- Implement authentication and authorization

---

## 5. System Analysis

### 5.1 Functional Requirements

#### User Management
- FR1: System shall allow user registration with role selection
- FR2: System shall authenticate users via email/password
- FR3: System shall support three roles: Student, Instructor, Admin

#### Course Management
- FR4: Instructors shall create and manage courses
- FR5: Students shall browse and enroll in courses
- FR6: System shall prevent duplicate enrollments

#### Assessment
- FR7: Instructors shall create quizzes for courses
- FR8: Students shall submit quiz responses
- FR9: System shall calculate and display performance statistics

#### Discussions (MongoDB)
- FR10: Users shall create discussion threads
- FR11: Users shall post comments in threads
- FR12: System shall support nested comment structure

#### Activity Tracking (MongoDB)
- FR13: System shall log all user activities
- FR14: System shall provide analytics on user behavior

### 5.2 Non-Functional Requirements

- **Performance:** Response time < 2 seconds for most operations
- **Security:** Passwords encrypted with bcrypt, JWT token authentication
- **Scalability:** Database design supports horizontal scaling
- **Maintainability:** Clean code architecture with separation of concerns
- **Availability:** 99% uptime target

### 5.3 Technology Stack Justification

| Technology | Justification |
|-----------|---------------|
| **Node.js** | Asynchronous I/O, JavaScript ecosystem, npm packages |
| **Express.js** | Lightweight, flexible, extensive middleware support |
| **MySQL** | ACID compliance, complex joins, mature ecosystem |
| **MongoDB** | Flexible schema, horizontal scalability, document model |
| **JWT** | Stateless authentication, scalable across servers |
| **bcrypt** | Industry-standard password hashing |

---

## 6. System Design

### 6.1 System Architecture

The system follows a **three-tier architecture**:

```
┌──────────────────────────┐
│   Presentation Layer     │  (Frontend: HTML/CSS/JS)
│   - User Interface       │
│   - Client-side Logic    │
└────────────┬─────────────┘
             │ HTTP/REST
             ▼
┌──────────────────────────┐
│   Application Layer      │  (Backend: Node.js/Express)
│   - Business Logic       │
│   - API Controllers      │
│   - Authentication       │
│   - Activity Logging     │
└────────────┬─────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│  MySQL   │  │ MongoDB  │  (Data Layer)
│  (SQL)   │  │ (NoSQL)  │
└──────────┘  └──────────┘
```

### 6.2 Database Selection Strategy

#### MySQL (Relational) Used For:
- **Users:** Strong consistency, unique email constraint
- **Courses:** Relationships with instructors
- **Enrollments:** Many-to-many relationships, prevent duplicates
- **Quizzes & Submissions:** Numeric data, aggregations (AVG, SUM)

**Rationale:**
- ACID transactions ensure data integrity
- Foreign keys prevent orphaned records
- Complex JOINs for analytics queries
- Aggregation functions for performance metrics

#### MongoDB (Document) Used For:
- **Discussions:** Nested posts (embedded documents)
- **Assignments:** Flexible submission types (file/link/text)
- **Activity Logs:** High-volume writes, time-series data

**Rationale:**
- Flexible schema for varying content
- Embedded documents reduce joins
- Better write performance for logs
- Horizontal scalability

### 6.3 API Design

RESTful API following standard conventions:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create course (instructor) |
| GET | `/api/courses/:id` | Get course details |
| POST | `/api/courses/:id/enroll` | Enroll in course (student) |
| GET | `/api/courses/my/courses` | Get enrolled courses |

---

## 7. Database Design

### 7.1 MySQL ER Diagram

```
┌─────────────┐
│    USERS    │
│─────────────│
│ PK user_id  │
│    name     │
│    email    │◄──────┐
│  password   │       │
│    role     │       │ instructs
└──────┬──────┘       │
       │              │
       │ enrolls      │
       ▼              │
┌──────────────┐      │
│ ENROLLMENTS  │      │
│──────────────│      │
│PK enroll_id  │      │
│FK student_id │      │
│FK course_id  │──┐   │
│   status     │  │   │
└──────────────┘  │   │
                  │   │
         ┌────────┘   │
         ▼            │
┌──────────────┐      │
│   COURSES    │      │
│──────────────│      │
│PK course_id  │      │
│ course_code  │      │
│ course_name  │      │
│FK instructor │──────┘
└──────┬───────┘
       │ has
       ▼
┌──────────────┐
│   QUIZZES    │
│──────────────│
│PK quiz_id    │
│FK course_id  │
│   title      │
│  max_marks   │
└──────┬───────┘
       │ has
       ▼
┌───────────────────┐
│ QUIZ_SUBMISSIONS  │
│───────────────────│
│PK submission_id   │
│FK quiz_id         │
│FK student_id      │
│   marks_obtained  │
└───────────────────┘
```

### 7.2 Relationships

1. **users → courses** (One-to-Many)
   - One instructor teaches many courses
   - FK: courses.instructor_id → users.user_id

2. **users ↔ courses** (Many-to-Many via enrollments)
   - Students enroll in multiple courses
   - Courses have multiple students

3. **courses → quizzes** (One-to-Many)
   - One course has many quizzes

4. **quizzes → quiz_submissions** (One-to-Many)
   - One quiz has many submissions

5. **users → quiz_submissions** (One-to-Many)
   - One student submits many quizzes

### 7.3 Normalization

#### First Normal Form (1NF)
✓ All attributes are atomic
✓ No repeating groups
✓ Each table has a primary key

#### Second Normal Form (2NF)
✓ In 1NF
✓ No partial dependencies
✓ All non-key attributes fully depend on primary key

Example: In `quiz_submissions`, both `marks_obtained` and `submitted_at` depend on the complete primary key (submission_id), not part of it.

#### Third Normal Form (3NF)
✓ In 2NF
✓ No transitive dependencies
✓ Non-key attributes depend only on primary key

Example: Instructor name is not stored in courses table; accessed via foreign key.

### 7.4 MongoDB Schema

#### discussions Collection
```javascript
{
  course_id: Number,           // Reference to MySQL
  title: String,
  created_by: Number,          // Reference to MySQL
  posts: [                     // Embedded documents
    {
      post_id: Number,
      user_id: Number,
      content: String,
      created_at: Date
    }
  ]
}
```

**Design Decision:** Embedded posts for better read performance and atomic updates.

#### assignments Collection
```javascript
{
  course_id: Number,
  assignment_title: String,
  max_marks: Number,
  submissions: [               // Embedded submissions
    {
      student_id: Number,
      submission_type: String, // file, link, text
      grade: Number,
      feedback: String
    }
  ]
}
```

**Design Decision:** Flexible submission_type allows different formats without schema changes.

---

## 8. Implementation

### 8.1 Backend Architecture

#### Layer 1: Routes
Define API endpoints and map to controllers
```javascript
router.post('/login', authController.login);
router.get('/courses', courseController.getAllCourses);
```

#### Layer 2: Controllers
Handle business logic and coordinate between layers
```javascript
const login = async (req, res) => {
  // Validate input
  // Query database
  // Generate JWT
  // Return response
};
```

#### Layer 3: Database Access
Separate concerns with dedicated connection modules
- `config/mysql.js` - Connection pool, query helpers
- `config/mongodb.js` - Mongoose connection
- `models/` - Mongoose schemas

#### Layer 4: Middleware
Cross-cutting concerns
- `middleware/auth.js` - JWT verification
- `middleware/activityLogger.js` - MongoDB logging

### 8.2 Key Implementation Details

#### Password Security
```javascript
// Registration
const passwordHash = await bcrypt.hash(password, 10);

// Login
const isValid = await bcrypt.compare(password, user.password_hash);
```

#### JWT Authentication
```javascript
// Generate token
const token = jwt.sign(
  { user_id, email, role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, JWT_SECRET);
```

#### Activity Logging (MongoDB)
```javascript
// Automatic logging middleware
const logActivity = (action) => {
  return async (req, res, next) => {
    // Intercept response
    // Log to MongoDB asynchronously
    // Don't block request
  };
};
```

### 8.3 Sample Queries

#### Complex JOIN (MySQL)
```sql
SELECT 
  c.course_name,
  u.name as instructor,
  COUNT(e.enrollment_id) as students,
  AVG(qs.marks_obtained) as avg_marks
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN quizzes q ON c.course_id = q.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id
GROUP BY c.course_id;
```

#### Aggregation (MongoDB)
```javascript
db.activity_logs.aggregate([
  {
    $match: { 
      timestamp: { $gte: ISODate("2025-11-01") }
    }
  },
  {
    $group: {
      _id: "$action",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { count: -1 }
  }
]);
```

---

## 9. Testing

### 9.1 Unit Testing

Tested individual components:
- Authentication functions (login, register)
- Database connection helpers
- Mongoose model methods

### 9.2 Integration Testing

Tested API endpoints:
- User registration and login flow
- Course creation and enrollment
- Quiz submission and grading

### 9.3 Test Cases

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Register with valid data | User created, token returned | ✓ Pass |
| Register with duplicate email | Error: Email exists | ✓ Pass |
| Login with correct credentials | Token returned | ✓ Pass |
| Login with wrong password | Error: Invalid credentials | ✓ Pass |
| Enroll in course (student) | Enrollment created | ✓ Pass |
| Duplicate enrollment | Error: Already enrolled | ✓ Pass |
| Create course (instructor) | Course created | ✓ Pass |
| Create course (student) | Error: Access denied | ✓ Pass |

### 9.4 Performance Testing

- Response times measured for key operations
- Database connection pooling configured
- Index performance validated

---

## 10. Results

### 10.1 Achievements

✅ Successfully implemented hybrid database architecture
✅ Demonstrated proper normalization (3NF)
✅ Created complex SQL queries with JOINs and aggregations
✅ Implemented MongoDB embedded documents and indexes
✅ Built secure authentication with JWT and bcrypt
✅ Automatic activity logging to MongoDB
✅ RESTful API with proper error handling
✅ Working frontend demonstrating API integration

### 10.2 Database Statistics

#### MySQL Database
- 5 tables (users, courses, enrollments, quizzes, quiz_submissions)
- 10+ foreign key constraints
- 15+ indexes for optimization
- Sample data: 7 users, 4 courses, 9 enrollments

#### MongoDB Database
- 3 collections (discussions, assignments, activity_logs)
- 10+ compound indexes
- Flexible schema with embedded documents

### 10.3 Code Metrics

- Total files: 25+
- Lines of code: ~3000+
- API endpoints: 15+
- Database queries: 50+ (sample queries provided)

---

## 11. Challenges Faced

### 11.1 Cross-Database Referencing

**Challenge:** MongoDB documents reference MySQL IDs, but no native foreign keys exist.

**Solution:** 
- Application-level validation before inserting
- Consistent use of numeric IDs across both databases
- Documentation of reference relationships

### 11.2 Password Hashing in Sample Data

**Challenge:** Sample SQL includes hashed passwords, but actual hash requires bcrypt.

**Solution:**
- Documented that sample hashes are placeholders
- Real passwords hashed on registration
- Provided clear demo credentials

### 11.3 Activity Logging Performance

**Challenge:** Logging every action could slow requests.

**Solution:**
- Asynchronous logging without blocking response
- MongoDB's fast writes handle high volume
- Optional TTL index for automatic cleanup

---

## 12. Future Scope

### Phase 2 Enhancements
- Complete quiz UI with question types (MCQ, short answer)
- Real-time discussion updates (WebSockets)
- File upload for assignments
- Grading interface for instructors
- Student analytics dashboard
- Advanced search and filtering

### Phase 3 Features
- Email notifications (nodemailer)
- Real-time chat between users
- Mobile app (React Native)
- PDF report generation
- Course materials management
- Attendance tracking system
- Video integration for lectures

### Technical Improvements
- Redis caching for frequently accessed data
- Elasticsearch for full-text search
- Docker containerization
- CI/CD pipeline
- Comprehensive test coverage
- GraphQL API alternative

---

## 13. Conclusion

This project successfully demonstrates the practical application of polyglot persistence by combining MySQL and MongoDB in a unified educational management system. 

**Key Learnings:**
1. **Database Selection:** Understanding when to use SQL vs NoSQL
2. **Normalization:** Proper application of normal forms
3. **Complex Queries:** JOINs, aggregations, subqueries
4. **Document Design:** Embedded vs referenced documents
5. **System Architecture:** Clean separation of concerns
6. **Security:** Authentication and authorization best practices

The hybrid approach leverages the strengths of both databases:
- MySQL handles structured, relational data with strong consistency
- MongoDB manages flexible, document-oriented data with high performance

This architecture pattern is applicable to many real-world applications where different data types have different storage requirements.

---

## 14. References

1. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database System Concepts* (7th ed.). McGraw-Hill.

2. Elmasri, R., & Navathe, S. B. (2015). *Fundamentals of Database Systems* (7th ed.). Pearson.

3. MongoDB, Inc. (2025). *MongoDB Manual*. Retrieved from https://docs.mongodb.com/

4. Oracle Corporation. (2025). *MySQL 8.0 Reference Manual*. Retrieved from https://dev.mysql.com/doc/

5. Fowler, M., & Sadalage, P. J. (2012). *NoSQL Distilled: A Brief Guide to the Emerging World of Polyglot Persistence*. Addison-Wesley.

6. Express.js Documentation. (2025). Retrieved from https://expressjs.com/

7. Node.js Documentation. (2025). Retrieved from https://nodejs.org/docs/

8. JWT.io. (2025). *JSON Web Tokens*. Retrieved from https://jwt.io/

---

**Project Submitted By:**
[Your Name]
[Roll Number]
[Course: Database Management Systems]
[Semester/Year]

**Submitted To:**
[Professor Name]
[Department]
[University Name]

**Date:** [Submission Date]

---

## Appendices

### Appendix A: Installation Guide
See `QUICKSTART.md` for detailed setup instructions.

### Appendix B: API Documentation
See `docs/API_DOCUMENTATION.md` for complete API reference.

### Appendix C: Database Design
See `docs/DATABASE_DESIGN.md` for detailed schema documentation.

### Appendix D: SQL Queries
See `database/mysql/queries.sql` for sample queries.

### Appendix E: Source Code
Complete source code available in project repository.

---

**End of Report**
