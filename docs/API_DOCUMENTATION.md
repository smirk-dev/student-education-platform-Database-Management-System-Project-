\# API Endpoints Documentation

## Base URL
```
http://localhost:3000/api
```

All endpoints return JSON responses in the following format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

---

## Authentication

### Register New User
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2025-11-30T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User Profile
**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "stats": {
      "enrolled_courses": 3,
      "quizzes_submitted": 5
    }
  }
}
```

---

### Update Profile
**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "user_id": 1,
      "name": "John Updated",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

---

### Change Password
**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Courses

### Get All Courses
**Endpoint:** `GET /api/courses`

**Headers (Optional):**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "course_id": 1,
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science",
        "description": "Fundamentals of programming...",
        "instructor_name": "Dr. Sarah Johnson",
        "instructor_email": "sarah@university.edu",
        "enrolled_students": 15,
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Get Course by ID
**Endpoint:** `GET /api/courses/:id`

**Headers (Optional):**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "course_id": 1,
      "course_code": "CS101",
      "course_name": "Introduction to Computer Science",
      "description": "Fundamentals of programming...",
      "instructor_id": 2,
      "instructor_name": "Dr. Sarah Johnson",
      "instructor_email": "sarah@university.edu",
      "enrolled_students": 15,
      "total_quizzes": 5,
      "is_enrolled": true,
      "enrollment_status": "active",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Create Course (Instructor/Admin only)
**Endpoint:** `POST /api/courses`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "course_code": "CS401",
  "course_name": "Advanced Web Development",
  "description": "Full-stack web development course"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "course": {
      "course_id": 5,
      "course_code": "CS401",
      "course_name": "Advanced Web Development",
      "description": "Full-stack web development course",
      "instructor_name": "Dr. Sarah Johnson",
      "instructor_email": "sarah@university.edu",
      "created_at": "2025-11-30T10:00:00.000Z"
    }
  }
}
```

---

### Get My Enrolled Courses (Student only)
**Endpoint:** `GET /api/courses/my/courses`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "course_id": 1,
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science",
        "description": "Fundamentals...",
        "instructor_name": "Dr. Sarah Johnson",
        "instructor_email": "sarah@university.edu",
        "enrolled_at": "2025-10-15T08:30:00.000Z",
        "enrollment_status": "active",
        "total_quizzes": 5,
        "quizzes_submitted": 3
      }
    ]
  }
}
```

---

### Enroll in Course (Student only)
**Endpoint:** `POST /api/courses/:id/enroll`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully enrolled in Introduction to Computer Science",
  "data": {
    "enrollment_id": 15,
    "course_id": 1,
    "course_name": "Introduction to Computer Science"
  }
}
```

---

### Get Course Students (Instructor/Admin only)
**Endpoint:** `GET /api/courses/:id/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "user_id": 4,
        "name": "Alice Smith",
        "email": "alice@student.edu",
        "enrolled_at": "2025-10-15T08:30:00.000Z",
        "status": "active",
        "quizzes_submitted": 3,
        "avg_percentage": 85.50
      }
    ]
  }
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 500 | Internal Server Error |

---

## Authentication Flow

1. **Register or Login** → Receive JWT token
2. **Store token** in localStorage or sessionStorage
3. **Include token** in Authorization header for protected routes:
   ```
   Authorization: Bearer <your_jwt_token>
   ```
4. **Token expires** after 7 days (default)

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- 100 requests per 15 minutes per IP
- Stricter limits for authentication endpoints

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"student"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Courses (with token)
```bash
curl http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with Postman

1. Import the base URL: `http://localhost:3000/api`
2. Create an environment variable for `token`
3. Set `Authorization` header: `Bearer {{token}}`
4. Test each endpoint according to the documentation above
