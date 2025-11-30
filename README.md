# 🎓 Hybrid Student Learning Portal

> A Database Management Systems (DBMS) Course Project demonstrating **Polyglot Persistence** using MySQL and MongoDB

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Why Both Databases?](#why-both-databases)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schemas](#database-schemas)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Demo Credentials](#demo-credentials)
- [ER Diagram](#er-diagram)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

The **Hybrid Student Learning Portal** is a full-stack web application that demonstrates the concept of **polyglot persistence** by strategically using both relational (MySQL) and NoSQL (MongoDB) databases in a single system.

### Purpose

This project showcases:
- When and why to use different database paradigms
- Integration of MySQL and MongoDB in a unified backend
- Real-world application of DBMS concepts (normalization, joins, indexing, etc.)
- RESTful API design with Express.js
- Full authentication and authorization flow

---

## 🤔 Why Both Databases?

### MySQL (Relational) - For Structured, Transactional Data

**Used for:**
- ✅ **Users** - Strong consistency, authentication
- ✅ **Courses** - Relationships with instructors
- ✅ **Enrollments** - Many-to-many relationships, foreign keys
- ✅ **Quizzes & Submissions** - Marks, grades, aggregations (AVG, SUM)

**Why?**
- ACID transactions ensure data integrity
- Complex JOINs for enrollment and performance queries
- Foreign key constraints prevent orphaned data
- Perfect for numerical data and aggregations

### MongoDB (NoSQL) - For Flexible, Nested Data

**Used for:**
- ✅ **Discussions** - Nested posts/comments (embedded documents)
- ✅ **Assignments** - Submissions with varying fields (file/link/text)
- ✅ **Activity Logs** - High-volume, time-series data

**Why?**
- Flexible schema for varying submission types
- Better performance for nested/hierarchical data
- Horizontal scalability for high-volume logs
- No need for complex JOINs for embedded data

---

## ✨ Features

### Implemented Features

✅ **User Management**
- Registration with role selection (Student/Instructor/Admin)
- JWT-based authentication
- Profile management

✅ **Course Management**
- Browse all courses
- View course details
- Create courses (Instructor/Admin)
- Enrollment system with duplicate prevention

✅ **Quiz System** (MySQL)
- Create quizzes for courses
- Submit quiz answers
- View marks and performance
- Aggregate statistics (average, min, max)

✅ **Activity Logging** (MongoDB)
- Automatic logging of all user actions
- Track logins, enrollments, views, submissions
- Analytics and reporting capabilities

### Demonstrated DBMS Concepts

📚 **MySQL Concepts**
- Primary Keys, Foreign Keys, Unique Constraints
- One-to-Many, Many-to-Many relationships
- Complex JOINs (INNER, LEFT)
- Aggregation functions (COUNT, AVG, ROUND)
- Subqueries
- Views
- Stored Procedures
- Transactions
- Indexing

📚 **MongoDB Concepts**
- Document-oriented storage
- Embedded vs Referenced documents
- Compound indexes
- Aggregation pipelines
- Flexible schema design
- Time-series optimization

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **MySQL:** mysql2 (with connection pooling)
- **MongoDB:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs

### Frontend
- **HTML5, CSS3, Vanilla JavaScript**
- Simple, minimal UI focusing on API demonstration

### Development Tools
- dotenv (environment management)
- nodemon (development server)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Browser)             │
│     HTML/CSS/JavaScript (SPA-like)       │
└───────────────┬─────────────────────────┘
                │ HTTP/REST API
                ▼
┌─────────────────────────────────────────┐
│        Express.js Backend Server         │
│  ┌─────────────────────────────────┐    │
│  │  Routes & Controllers Layer     │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Middleware (Auth, Logging)     │    │
│  └─────────────────────────────────┘    │
└───────┬─────────────────────┬───────────┘
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│     MySQL     │     │   MongoDB     │
├───────────────┤     ├───────────────┤
│ • users       │     │ • discussions │
│ • courses     │     │ • assignments │
│ • enrollments │     │ • activity_   │
│ • quizzes     │     │   logs        │
│ • quiz_       │     └───────────────┘
│   submissions │
└───────────────┘
```

---

## 🗄️ Database Schemas

### MySQL Schema (Relational)

#### users
```sql
user_id (PK, AUTO_INCREMENT)
name
email (UNIQUE)
password_hash
role (ENUM: student, instructor, admin)
created_at
```

#### courses
```sql
course_id (PK, AUTO_INCREMENT)
course_code (UNIQUE)
course_name
description
instructor_id (FK → users.user_id)
created_at
```

#### enrollments
```sql
enrollment_id (PK, AUTO_INCREMENT)
student_id (FK → users.user_id)
course_id (FK → courses.course_id)
enrolled_at
status (ENUM: active, dropped, completed)
UNIQUE (student_id, course_id)
```

#### quizzes
```sql
quiz_id (PK, AUTO_INCREMENT)
course_id (FK → courses.course_id)
title
max_marks
due_date
```

#### quiz_submissions
```sql
submission_id (PK, AUTO_INCREMENT)
quiz_id (FK → quizzes.quiz_id)
student_id (FK → users.user_id)
marks_obtained
submitted_at
```

### MongoDB Schema (Document)

#### discussions
```javascript
{
  course_id: Number,  // References MySQL course_id
  title: String,
  created_by: Number,  // References MySQL user_id
  posts: [
    {
      post_id: Number,
      user_id: Number,
      content: String,
      created_at: Date
    }
  ]
}
```

#### assignments
```javascript
{
  course_id: Number,
  assignment_title: String,
  description: String,
  due_date: Date,
  max_marks: Number,
  submissions: [
    {
      student_id: Number,
      submitted_at: Date,
      submission_type: String,  // file, link, or text
      file_path: String,
      grade: Number,
      feedback: String
    }
  ]
}
```

#### activity_logs
```javascript
{
  user_id: Number,
  action: String,  // LOGIN, VIEW_COURSE, ENROLL_COURSE, etc.
  course_id: Number,
  timestamp: Date,
  metadata: {
    ip_address: String,
    browser: String,
    os: String
  }
}
```

---

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js** (v14 or higher)
2. **MySQL** (v8.0 or higher)
3. **MongoDB** (v5.0 or higher)

### Step 1: Clone and Install Dependencies

```powershell
# Navigate to project directory
cd student-education-platform-Database-Management-System-Project-

# Install dependencies
npm install
```

### Step 2: Setup MySQL Database

```powershell
# Login to MySQL
mysql -u root -p

# Run the schema file
source database/mysql/schema.sql

# Or on Windows:
mysql -u root -p < database/mysql/schema.sql
```

### Step 3: Setup MongoDB

```powershell
# Start MongoDB service (if not running)
net start MongoDB

# MongoDB will automatically create the database on first connection
```

### Step 4: Configure Environment Variables

```powershell
# Copy example env file
copy .env.example .env

# Edit .env with your credentials
# Use notepad or any text editor
notepad .env
```

**Update these values in `.env`:**
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=student_portal

MONGODB_URI=mongodb://localhost:27017/student_portal

PORT=3000
JWT_SECRET=your_secret_key_change_this
```

### Step 5: Initialize and Run

```powershell
# Test database connections
npm run init-db

# Start the server
npm start

# Or use development mode with auto-reload
npm run dev
```

### Step 6: Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api

---

## 📡 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Course Endpoints

#### Get All Courses
```http
GET /api/courses
```

#### Get Course by ID
```http
GET /api/courses/:id
Authorization: Bearer <token> (optional)
```

#### Create Course (Instructor/Admin)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_code": "CS101",
  "course_name": "Introduction to CS",
  "description": "Course description"
}
```

#### Enroll in Course (Student)
```http
POST /api/courses/:id/enroll
Authorization: Bearer <token>
```

#### Get My Enrolled Courses (Student)
```http
GET /api/courses/my/courses
Authorization: Bearer <token>
```

---

## 📁 Project Structure

```
student-education-platform-Database-Management-System-Project-/
│
├── database/
│   └── mysql/
│       ├── schema.sql          # MySQL table definitions & sample data
│       └── queries.sql         # Sample queries & views
│
├── src/
│   ├── config/
│   │   ├── mysql.js            # MySQL connection pool
│   │   └── mongodb.js          # MongoDB connection
│   │
│   ├── models/
│   │   ├── Discussion.js       # Mongoose model
│   │   ├── Assignment.js       # Mongoose model
│   │   └── ActivityLog.js      # Mongoose model
│   │
│   ├── controllers/
│   │   ├── authController.js   # Auth logic
│   │   └── courseController.js # Course logic
│   │
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   └── courseRoutes.js     # Course endpoints
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── activityLogger.js   # MongoDB logging
│   │
│   ├── scripts/
│   │   └── initDatabase.js     # DB initialization
│   │
│   └── server.js               # Express app entry point
│
├── public/
│   ├── index.html              # Frontend HTML
│   ├── styles.css              # Frontend CSS
│   └── app.js                  # Frontend JavaScript
│
├── .env.example                # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Demo Credentials

After running the schema.sql, you can use these pre-created accounts:

### Admin
- **Email:** admin@university.edu
- **Password:** password123

### Instructor
- **Email:** sarah.johnson@university.edu
- **Password:** password123

### Student
- **Email:** alice.smith@student.edu
- **Password:** password123

---

## 📊 ER Diagram

### MySQL Entities and Relationships

```
┌─────────┐         instructs        ┌──────────┐
│  users  │─────────────────────────▶│ courses  │
└────┬────┘                          └────┬─────┘
     │                                    │
     │ enrolls                            │ has
     │                                    │
     ▼                                    ▼
┌──────────────┐                    ┌─────────┐
│ enrollments  │                    │ quizzes │
└──────────────┘                    └────┬────┘
                                         │
                                         │ has
                                         ▼
                                   ┌──────────────────┐
                                   │ quiz_submissions │
                                   └──────────────────┘
```

### Relationships:
- **users → courses**: One-to-Many (instructor teaches many courses)
- **users → enrollments**: One-to-Many (student enrolls in many courses)
- **courses → enrollments**: One-to-Many (course has many students)
- **courses → quizzes**: One-to-Many (course has many quizzes)
- **quizzes → quiz_submissions**: One-to-Many (quiz has many submissions)
- **users → quiz_submissions**: One-to-Many (student submits many quizzes)

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Complete quiz and assignment management UI
- [ ] Discussion forum with real-time updates
- [ ] File upload for assignments
- [ ] Grading interface for instructors
- [ ] Student analytics dashboard
- [ ] Course search and filtering

### Phase 3 Features
- [ ] Email notifications
- [ ] Real-time chat (Socket.io)
- [ ] Mobile responsive design
- [ ] Export reports (PDF/Excel)
- [ ] Course materials management
- [ ] Attendance tracking

---

## 🎓 Learning Outcomes

This project demonstrates:

1. **Database Design**
   - Normalization (3NF)
   - ER modeling
   - Choosing between SQL and NoSQL

2. **SQL Skills**
   - Complex JOINs
   - Aggregations and subqueries
   - Views and stored procedures
   - Transactions and ACID properties

3. **MongoDB Skills**
   - Document modeling
   - Embedding vs referencing
   - Aggregation pipelines
   - Indexing strategies

4. **Full-Stack Development**
   - RESTful API design
   - JWT authentication
   - MVC architecture
   - Error handling

5. **System Integration**
   - Polyglot persistence
   - Cross-database operations
   - Maintaining referential integrity across databases

---

## 📝 License

This project is for educational purposes as part of a DBMS course.

---

## 👥 Contributors

Your Name - DBMS Course Project

---

## 🙏 Acknowledgments

- Built as a Database Management Systems course project
- Demonstrates real-world database design principles
- Showcases modern web development practices

---

**Happy Coding! 🚀**