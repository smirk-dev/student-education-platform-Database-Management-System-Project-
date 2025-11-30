# Database Design Document

## Overview

This document provides a comprehensive explanation of the database design for the Hybrid Student Learning Portal, including design decisions, normalization, and the rationale for using both MySQL and MongoDB.

---

## Database Selection Strategy

### Polyglot Persistence Approach

The system uses **two different database paradigms** for different types of data:

| Database | Type | Use Case | Reason |
|----------|------|----------|--------|
| **MySQL** | Relational (SQL) | Structured, transactional data | ACID compliance, complex relationships, numerical aggregations |
| **MongoDB** | Document (NoSQL) | Flexible, nested data | Schema flexibility, embedded documents, high-write performance |

---

## MySQL Database Design

### Entity-Relationship Model

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ PK: user_id     │
│     name        │
│     email       │◄─────┐
│     password    │      │
│     role        │      │ Instructs
└────────┬────────┘      │
         │               │
         │ Enrolls       │
         │               │
         ▼               │
┌─────────────────┐      │
│  ENROLLMENTS    │      │
│─────────────────│      │
│ PK: enroll_id   │      │
│ FK: student_id  │      │
│ FK: course_id   │───┐  │
│     status      │   │  │
└─────────────────┘   │  │
                      │  │
         ┌────────────┘  │
         │               │
         ▼               │
┌─────────────────┐      │
│    COURSES      │      │
│─────────────────│      │
│ PK: course_id   │      │
│     code        │      │
│     name        │      │
│ FK: instructor  │──────┘
└────────┬────────┘
         │
         │ Has
         │
         ▼
┌─────────────────┐
│    QUIZZES      │
│─────────────────│
│ PK: quiz_id     │
│ FK: course_id   │
│     title       │
│     max_marks   │
└────────┬────────┘
         │
         │ Has
         │
         ▼
┌──────────────────┐
│ QUIZ_SUBMISSIONS │
│──────────────────│
│ PK: submission_id│
│ FK: quiz_id      │
│ FK: student_id   │
│     marks        │
└──────────────────┘
```

---

## MySQL Tables (Detailed)

### 1. users

**Purpose:** Store all system users with authentication credentials

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Email address (login) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | ENUM | NOT NULL, DEFAULT 'student' | student, instructor, admin |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- Primary: `user_id`
- Unique: `email`
- Regular: `role` (for filtering by role)

**Design Decisions:**
- Email is unique to prevent duplicate accounts
- Password is hashed with bcrypt (10 rounds)
- Role uses ENUM for data integrity
- Timestamps for audit trail

---

### 2. courses

**Purpose:** Store course information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| course_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| course_code | VARCHAR(20) | NOT NULL, UNIQUE | Course code (e.g., CS101) |
| course_name | VARCHAR(200) | NOT NULL | Full course name |
| description | TEXT | NULL | Course description |
| instructor_id | INT | NOT NULL, FK → users.user_id | Who teaches this course |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update |

**Relationships:**
- **Many-to-One** with users (instructor)
- **One-to-Many** with enrollments
- **One-to-Many** with quizzes

**Indexes:**
- Primary: `course_id`
- Unique: `course_code`
- Foreign Key: `instructor_id`

**Design Decisions:**
- Course code is unique business identifier
- Instructor must exist (foreign key constraint)
- ON DELETE CASCADE: If instructor deleted, course deleted (can be changed to RESTRICT)

---

### 3. enrollments

**Purpose:** Many-to-many relationship between students and courses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| enrollment_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| student_id | INT | NOT NULL, FK → users.user_id | Enrolled student |
| course_id | INT | NOT NULL, FK → courses.course_id | Enrolled course |
| enrolled_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Enrollment time |
| status | ENUM | DEFAULT 'active' | active, dropped, completed |

**Relationships:**
- **Many-to-One** with users (student)
- **Many-to-One** with courses

**Constraints:**
- UNIQUE (student_id, course_id) - Prevents duplicate enrollments

**Indexes:**
- Primary: `enrollment_id`
- Composite Unique: `(student_id, course_id)`
- Foreign Keys: `student_id`, `course_id`
- Regular: `status`

**Design Decisions:**
- Junction table for many-to-many relationship
- Status allows tracking enrollment lifecycle
- Unique constraint ensures one enrollment per student-course pair

---

### 4. quizzes

**Purpose:** Store quiz/assessment information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| quiz_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| course_id | INT | NOT NULL, FK → courses.course_id | Parent course |
| title | VARCHAR(200) | NOT NULL | Quiz title |
| description | TEXT | NULL | Quiz description |
| max_marks | INT | NOT NULL, DEFAULT 100 | Maximum possible marks |
| due_date | DATETIME | NULL | Submission deadline |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation time |
| is_active | BOOLEAN | DEFAULT TRUE | Active/inactive status |

**Relationships:**
- **Many-to-One** with courses
- **One-to-Many** with quiz_submissions

**Indexes:**
- Primary: `quiz_id`
- Foreign Key: `course_id`
- Regular: `due_date` (for deadline queries)

---

### 5. quiz_submissions

**Purpose:** Store student quiz submissions and grades

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| submission_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| quiz_id | INT | NOT NULL, FK → quizzes.quiz_id | Which quiz |
| student_id | INT | NOT NULL, FK → users.user_id | Who submitted |
| marks_obtained | INT | NOT NULL | Marks scored |
| submitted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Submission time |
| graded_at | DATETIME | NULL | When graded |
| feedback | TEXT | NULL | Instructor feedback |

**Relationships:**
- **Many-to-One** with quizzes
- **Many-to-One** with users (student)

**Constraints:**
- UNIQUE (quiz_id, student_id) - One submission per student per quiz

**Indexes:**
- Primary: `submission_id`
- Composite Unique: `(quiz_id, student_id)`
- Foreign Keys: `quiz_id`, `student_id`

---

## Normalization

### Normal Forms Achieved

#### First Normal Form (1NF)
✅ All tables have atomic values
✅ Each column contains only one value
✅ All entries in a column are of the same type
✅ Each row is unique (primary key)

#### Second Normal Form (2NF)
✅ In 1NF
✅ All non-key attributes fully depend on primary key
✅ No partial dependencies exist

Example: In `quiz_submissions`, both `marks_obtained` and `submitted_at` depend on the full composite key `(quiz_id, student_id)`, not just part of it.

#### Third Normal Form (3NF)
✅ In 2NF
✅ No transitive dependencies
✅ Non-key attributes depend only on primary key

Example: Course name is not stored in enrollments; it's accessed via foreign key to courses table.

---

## MongoDB Collections Design

### Why MongoDB for These Collections?

1. **Flexible Schema** - Different submission types don't require schema changes
2. **Embedded Documents** - Posts within discussions, submissions within assignments
3. **High Write Volume** - Activity logs benefit from MongoDB's write performance
4. **No Complex Joins** - Document structure reduces need for joins

---

### 1. discussions Collection

**Purpose:** Store course discussion threads with nested posts

```javascript
{
  _id: ObjectId("..."),
  course_id: 1,                    // References MySQL courses.course_id
  title: "Question about Lecture 5",
  created_by: 4,                   // References MySQL users.user_id
  created_at: ISODate("2025-11-30"),
  updated_at: ISODate("2025-12-01"),
  is_pinned: false,
  is_locked: false,
  tags: ["lecture", "arrays"],
  posts: [
    {
      post_id: 1,
      user_id: 4,                  // References MySQL users.user_id
      content: "Can someone explain...?",
      created_at: ISODate("2025-11-30T10:00:00Z"),
      edited_at: null,
      is_edited: false
    },
    {
      post_id: 2,
      user_id: 2,
      content: "Sure! Let me explain...",
      created_at: ISODate("2025-11-30T11:00:00Z")
    }
  ],
  post_count: 2
}
```

**Design Decisions:**
- **Embedded Posts** instead of separate collection for better read performance
- Denormalized `post_count` for quick access
- User information fetched from MySQL when needed (no duplication)
- Post IDs are sequential within each discussion

**Indexes:**
```javascript
{ course_id: 1, created_at: -1 }   // Find discussions by course
{ created_by: 1 }                   // Find user's discussions
{ 'posts.user_id': 1 }             // Find user's posts
```

---

### 2. assignments Collection

**Purpose:** Store assignments with flexible submission types

```javascript
{
  _id: ObjectId("..."),
  course_id: 3,
  assignment_title: "Build a Database",
  description: "Design and implement...",
  instructions: "Follow the guidelines...",
  max_marks: 100,
  due_date: ISODate("2025-12-15"),
  created_at: ISODate("2025-11-20"),
  created_by: 2,                   // Instructor
  is_active: true,
  allow_late_submission: false,
  attachments: [
    {
      filename: "guidelines.pdf",
      file_path: "/uploads/guidelines.pdf",
      uploaded_at: ISODate("2025-11-20")
    }
  ],
  submissions: [
    {
      student_id: 4,
      submitted_at: ISODate("2025-12-14"),
      submission_type: "file",     // file, link, or text
      file_path: "/submissions/assignment1_student4.zip",
      grade: 85,
      graded_at: ISODate("2025-12-16"),
      graded_by: 2,
      feedback: "Good work!",
      status: "graded"             // submitted, graded, late
    }
  ],
  submission_count: 1
}
```

**Design Decisions:**
- **Flexible submission_type** allows files, links, or text without schema changes
- **Embedded submissions** for atomic updates and better locality
- Attachments array for multiple reference files
- Status tracking (submitted, graded, late)

**Indexes:**
```javascript
{ course_id: 1, due_date: -1 }     // Upcoming assignments
{ 'submissions.student_id': 1 }    // Student's submissions
{ created_by: 1 }                  // Instructor's assignments
```

---

### 3. activity_logs Collection

**Purpose:** High-volume activity tracking

```javascript
{
  _id: ObjectId("..."),
  user_id: 4,
  action: "ENROLL_COURSE",
  timestamp: ISODate("2025-11-30T10:00:00Z"),
  course_id: 1,
  resource_type: "enrollment",
  resource_id: 15,
  metadata: {
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    browser: "Chrome",
    os: "Windows",
    device_type: "desktop"
  },
  success: true
}
```

**Design Decisions:**
- **Time-series optimized** - indexed by timestamp
- **Flexible metadata** - Different actions have different context
- **Write-optimized** - MongoDB handles high-volume inserts better
- Optional TTL index for automatic log cleanup

**Indexes:**
```javascript
{ user_id: 1, timestamp: -1 }      // User activity history
{ action: 1, timestamp: -1 }       // Filter by action type
{ course_id: 1, timestamp: -1 }    // Course activity
{ timestamp: -1 }                  // Recent activity
```

**Optional TTL Index:**
```javascript
{ timestamp: 1 }, { expireAfterSeconds: 31536000 }  // 1 year
```

---

## Cross-Database Referencing

### Reference Strategy

MySQL ← → MongoDB references are handled via numeric IDs:

```javascript
// MongoDB document references MySQL via numeric IDs
{
  course_id: 1,      // References MySQL courses.course_id
  user_id: 4         // References MySQL users.user_id
}
```

### Why Not Use ObjectId in MySQL?

- MySQL doesn't natively support ObjectId format
- Numeric IDs are universal and efficient
- No need to store MongoDB ObjectIds in MySQL

### Maintaining Referential Integrity

⚠️ **Challenge:** No native foreign keys across databases

**Solutions Implemented:**

1. **Application-Level Validation**
   ```javascript
   // Before inserting into MongoDB, verify ID exists in MySQL
   const user = await mysqlQuery('SELECT user_id FROM users WHERE user_id = ?', [userId]);
   if (!user) throw new Error('User not found');
   ```

2. **Orphan Cleanup Jobs**
   ```javascript
   // Periodic cleanup of orphaned MongoDB documents
   // Delete discussions/assignments for deleted courses
   ```

3. **Soft Deletes** (Alternative approach)
   - Mark records as deleted instead of removing them
   - Prevents orphaned references

---

## Query Patterns

### Common MySQL Queries

#### Complex Join: Student Course Details
```sql
SELECT 
  c.course_name,
  c.course_code,
  u.name as instructor,
  e.enrolled_at,
  COUNT(q.quiz_id) as total_quizzes,
  COUNT(qs.submission_id) as submitted_quizzes,
  AVG(qs.marks_obtained) as avg_marks
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.course_id
INNER JOIN users u ON c.instructor_id = u.user_id
LEFT JOIN quizzes q ON c.course_id = q.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id 
  AND qs.student_id = e.student_id
WHERE e.student_id = ?
GROUP BY c.course_id;
```

#### Aggregation: Course Performance
```sql
SELECT 
  c.course_name,
  COUNT(DISTINCT e.student_id) as total_students,
  AVG((qs.marks_obtained / q.max_marks) * 100) as avg_percentage
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN quizzes q ON c.course_id = q.course_id
LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id
GROUP BY c.course_id
HAVING total_students > 0;
```

### Common MongoDB Queries

#### Aggregation: Discussion Activity by Course
```javascript
db.discussions.aggregate([
  {
    $match: { course_id: 1 }
  },
  {
    $project: {
      title: 1,
      post_count: { $size: "$posts" },
      latest_activity: { $max: "$posts.created_at" }
    }
  },
  {
    $sort: { latest_activity: -1 }
  }
])
```

#### Assignment Statistics
```javascript
db.assignments.aggregate([
  {
    $match: { course_id: 1 }
  },
  {
    $project: {
      assignment_title: 1,
      total_submissions: { $size: "$submissions" },
      avg_grade: { $avg: "$submissions.grade" }
    }
  }
])
```

---

## Performance Considerations

### MySQL Optimizations

1. **Indexes on Foreign Keys** - Fast joins
2. **Composite Indexes** - For multi-column queries
3. **Connection Pooling** - Reuse database connections
4. **Query Caching** - MySQL query cache (if enabled)

### MongoDB Optimizations

1. **Compound Indexes** - Multi-field queries
2. **Covered Queries** - Index-only queries
3. **Projection** - Return only needed fields
4. **Aggregation Pipeline** - Efficient data processing

---

## Backup and Recovery

### MySQL Backup
```bash
mysqldump -u root -p student_portal > backup.sql
```

### MongoDB Backup
```bash
mongodump --db student_portal --out backup/
```

---

## Conclusion

This hybrid database design leverages the strengths of both SQL and NoSQL:

- **MySQL** handles structured, relational data with strong consistency
- **MongoDB** manages flexible, nested data with high write throughput

The design demonstrates real-world polyglot persistence while maintaining data integrity and performance.
