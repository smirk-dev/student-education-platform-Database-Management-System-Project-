# Quick Start Guide

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js (v14 or higher) installed
- [ ] MySQL (v8.0 or higher) installed and running
- [ ] MongoDB (v5.0 or higher) installed and running
- [ ] Git (optional, for version control)
- [ ] A code editor (VS Code recommended)

---

## Installation Steps

### 1. Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

This will install all required packages:
- express (web framework)
- mysql2 (MySQL client)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- dotenv (environment variables)
- cors (CORS middleware)

---

### 2. Setup MySQL

#### Start MySQL Service
```powershell
# Check if MySQL is running
Get-Service MySQL*

# Start MySQL if not running
Start-Service MySQL80
```

#### Create Database and Tables
```powershell
# Login to MySQL
mysql -u root -p

# Then run (inside MySQL shell):
source database/mysql/schema.sql

# Or from PowerShell directly:
Get-Content database\mysql\schema.sql | mysql -u root -p
```

This creates:
- Database: `student_portal`
- Tables: users, courses, enrollments, quizzes, quiz_submissions
- Sample data for testing

---

### 3. Setup MongoDB

#### Start MongoDB Service
```powershell
# Start MongoDB
net start MongoDB

# Or if installed as service:
Start-Service MongoDB
```

#### Verify MongoDB is Running
```powershell
# Connect to MongoDB shell
mongosh

# Inside mongosh:
show dbs
exit
```

MongoDB will automatically create the `student_portal` database when first accessed.

---

### 4. Configure Environment Variables

#### Create .env file
```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit with your settings
notepad .env
```

#### Update .env with Your Settings
```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
MYSQL_DATABASE=student_portal

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/student_portal

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (change this to a random string)
JWT_SECRET=my_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

⚠️ **Important:** Replace `YOUR_MYSQL_PASSWORD_HERE` with your actual MySQL root password!

---

### 5. Test Database Connections

```powershell
npm run init-db
```

You should see:
```
========================================
Initializing Database Connections...
========================================

✓ MySQL connected successfully
  Database: student_portal
  Host: localhost:3306

✓ MongoDB connected successfully
  Database: student_portal
  Host: localhost:27017

========================================
✓ All database connections successful!
========================================
```

If you see any errors, check:
- MySQL service is running
- MongoDB service is running
- Credentials in .env are correct
- Databases exist

---

### 6. Start the Server

#### Development Mode (with auto-reload)
```powershell
npm run dev
```

#### Production Mode
```powershell
npm start
```

You should see:
```
========================================
Starting Hybrid Student Learning Portal
========================================

Connecting to MySQL...
✓ MySQL connected successfully
  Database: student_portal
  Host: localhost:3306

Connecting to MongoDB...
✓ MongoDB connected successfully
  Database: student_portal
  Host: localhost:27017

========================================
✓ Server running on port 3000
  Local: http://localhost:3000
  API: http://localhost:3000/api
========================================
```

---

## Access the Application

### Frontend
Open your browser and go to:
```
http://localhost:3000
```

### API Documentation
```
http://localhost:3000/api
```

### Health Check
```
http://localhost:3000/api/health
```

---

## Test with Demo Accounts

The schema.sql file includes demo accounts with password: `password123`

### Admin Account
- Email: `admin@university.edu`
- Password: `password123`

### Instructor Account
- Email: `sarah.johnson@university.edu`
- Password: `password123`

### Student Account
- Email: `alice.smith@student.edu`
- Password: `password123`

---

## Testing the APIs

### Using Browser (Simple)

1. Go to http://localhost:3000
2. Click "Login"
3. Use demo credentials
4. Browse courses and test enrollment

### Using cURL (Command Line)

#### Login
```powershell
$body = @{
    email = "alice.smith@student.edu"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

# Save token
$token = $response.data.token
echo $token
```

#### Get Courses
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/courses" -Headers $headers
```

### Using Postman

1. Create new request
2. Set URL: `http://localhost:3000/api/auth/login`
3. Method: POST
4. Body → raw → JSON:
```json
{
  "email": "alice.smith@student.edu",
  "password": "password123"
}
```
5. Send request
6. Copy token from response
7. For authenticated requests:
   - Add header: `Authorization: Bearer YOUR_TOKEN`

---

## Common Issues and Solutions

### Issue: MySQL Connection Failed

**Error:** `ER_ACCESS_DENIED_ERROR`

**Solution:**
1. Check MySQL password in .env
2. Verify MySQL user has permissions:
```sql
GRANT ALL PRIVILEGES ON student_portal.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

---

### Issue: MongoDB Connection Failed

**Error:** `MongoServerSelectionError`

**Solution:**
1. Start MongoDB service:
```powershell
net start MongoDB
```
2. Check MongoDB is listening on port 27017:
```powershell
netstat -an | Select-String "27017"
```

---

### Issue: Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process (replace PID)
Stop-Process -Id PID_NUMBER -Force

# Or change port in .env
PORT=3001
```

---

### Issue: Schema Not Found

**Error:** Tables don't exist

**Solution:**
```powershell
# Re-run schema creation
mysql -u root -p student_portal < database/mysql/schema.sql

# Verify tables exist
mysql -u root -p -e "USE student_portal; SHOW TABLES;"
```

---

## Development Workflow

### Making Changes

1. **Edit code** in `src/` directory
2. **Server auto-reloads** (if using `npm run dev`)
3. **Test changes** in browser or API client
4. **Check logs** in terminal

### Adding New Features

1. **Database changes:**
   - Update `database/mysql/schema.sql` for MySQL tables
   - Update models in `src/models/` for MongoDB collections

2. **Backend changes:**
   - Add controller in `src/controllers/`
   - Add routes in `src/routes/`
   - Update `src/server.js` to include routes

3. **Frontend changes:**
   - Update `public/index.html`
   - Update `public/app.js`
   - Update `public/styles.css`

---

## Project Structure Overview

```
project-root/
│
├── database/
│   └── mysql/
│       ├── schema.sql          # Run this first!
│       └── queries.sql         # Sample queries for learning
│
├── src/
│   ├── config/                 # Database connections
│   ├── models/                 # MongoDB schemas
│   ├── controllers/            # Business logic
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, logging, etc.
│   └── server.js               # Main entry point
│
├── public/                     # Frontend files
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── docs/                       # Documentation
│
├── .env                        # Your local config (create this!)
├── .env.example                # Template
├── package.json                # Dependencies
└── README.md                   # Main documentation
```

---

## Next Steps

After setup, you can:

1. **Explore the frontend** at http://localhost:3000
2. **Test APIs** with Postman or cURL
3. **Run sample queries** from `database/mysql/queries.sql`
4. **Read documentation** in `docs/` folder
5. **Add new features** following the existing patterns

---

## Useful Commands

```powershell
# Install dependencies
npm install

# Initialize databases
npm run init-db

# Start development server (auto-reload)
npm run dev

# Start production server
npm start

# Check MySQL status
Get-Service MySQL*

# Check MongoDB status
Get-Service MongoDB

# View MySQL data
mysql -u root -p
> USE student_portal;
> SELECT * FROM users;

# View MongoDB data
mongosh
> use student_portal
> db.activity_logs.find().pretty()
```

---

## Getting Help

If you encounter issues:

1. Check terminal logs for error messages
2. Verify all services are running
3. Check `.env` configuration
4. Review documentation in `docs/` folder
5. Test with demo accounts first

---

## Ready to Start!

You're all set! The system should be running at:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

Start by logging in with a demo account and exploring the features.

Happy coding! 🚀
