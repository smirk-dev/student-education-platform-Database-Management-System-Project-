// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State management
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved token
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        loadUserProfile();
    }
    
    // Load courses on home page
    loadCourses();
});

// Page navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const pageMap = {
        'home': 'homePage',
        'login': 'loginPage',
        'register': 'registerPage',
        'courses': 'coursesPage',
        'dashboard': 'dashboardPage',
        'courseDetail': 'courseDetailPage'
    };
    
    const pageId = pageMap[pageName];
    if (pageId) {
        document.getElementById(pageId).classList.add('active');
        
        // Load data for specific pages
        if (pageName === 'courses') {
            loadCourses();
        } else if (pageName === 'dashboard' && currentUser) {
            loadDashboard();
        }
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            
            updateNavigation();
            showPage('dashboard');
            loadDashboard();
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.classList.add('show');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const errorDiv = document.getElementById('registerError');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            
            updateNavigation();
            showPage('dashboard');
            loadDashboard();
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Registration failed. Please try again.';
        errorDiv.classList.add('show');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateNavigation();
    showPage('home');
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.data.user;
            updateNavigation();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        logout();
    }
}

function updateNavigation() {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (currentUser) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        dashboardLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        dashboardLink.style.display = 'none';
    }
}

// Course functions
async function loadCourses() {
    const coursesList = document.getElementById('coursesList');
    coursesList.innerHTML = '<p>Loading courses...</p>';
    
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/courses`, { headers });
        const data = await response.json();
        
        if (data.success && data.data.courses.length > 0) {
            coursesList.innerHTML = data.data.courses.map(course => `
                <div class="course-card">
                    <div class="course-code">${course.course_code}</div>
                    <h3>${course.course_name}</h3>
                    <p class="course-instructor">👨‍🏫 ${course.instructor_name}</p>
                    <p class="course-students">👥 ${course.enrolled_students} students</p>
                    <p>${course.description || 'No description available'}</p>
                    <button class="btn btn-primary" onclick="viewCourse(${course.course_id})">
                        View Details
                    </button>
                </div>
            `).join('');
        } else {
            coursesList.innerHTML = '<p>No courses available</p>';
        }
    } catch (error) {
        coursesList.innerHTML = '<p>Failed to load courses</p>';
        console.error('Load courses error:', error);
    }
}

async function viewCourse(courseId) {
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, { headers });
        const data = await response.json();
        
        if (data.success) {
            const course = data.data.course;
            const courseDetail = document.getElementById('courseDetail');
            
            let enrollButton = '';
            if (currentUser && currentUser.role === 'student') {
                if (course.is_enrolled) {
                    enrollButton = '<span class="success-message">✓ You are enrolled</span>';
                } else {
                    enrollButton = `<button class="btn btn-success" onclick="enrollInCourse(${courseId})">Enroll Now</button>`;
                }
            }
            
            courseDetail.innerHTML = `
                <button class="btn" onclick="showPage('courses')" style="margin-bottom: 1rem;">← Back to Courses</button>
                <div class="course-detail-card" style="background: white; padding: 2rem; border-radius: 8px;">
                    <div class="course-code">${course.course_code}</div>
                    <h2>${course.course_name}</h2>
                    <p class="course-instructor">👨‍🏫 ${course.instructor_name} (${course.instructor_email})</p>
                    <p class="course-students">👥 ${course.enrolled_students} students enrolled</p>
                    <p style="margin: 1rem 0;">${course.description || 'No description available'}</p>
                    <p><strong>Total Quizzes:</strong> ${course.total_quizzes}</p>
                    ${enrollButton}
                </div>
            `;
            
            showPage('courseDetail');
        }
    } catch (error) {
        console.error('View course error:', error);
    }
}

async function enrollInCourse(courseId) {
    if (!authToken) {
        alert('Please login to enroll');
        showPage('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            viewCourse(courseId);
            loadDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Enrollment failed. Please try again.');
        console.error('Enroll error:', error);
    }
}

// Dashboard functions
async function loadDashboard() {
    if (!currentUser) return;
    
    const profileSection = document.getElementById('profileSection');
    const enrolledCourses = document.getElementById('enrolledCourses');
    
    // Display profile
    const roleClass = `badge-${currentUser.role}`;
    profileSection.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
            <div>
                <h3>${currentUser.name}</h3>
                <p>${currentUser.email}</p>
                <span class="badge ${roleClass}">${currentUser.role}</span>
            </div>
        </div>
    `;
    
    // Load enrolled courses for students
    if (currentUser.role === 'student') {
        try {
            const response = await fetch(`${API_BASE_URL}/courses/my/courses`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            const data = await response.json();
            
            if (data.success && data.data.courses.length > 0) {
                enrolledCourses.innerHTML = `
                    <h3 style="margin-bottom: 1rem;">My Enrolled Courses</h3>
                    <div class="courses-grid">
                        ${data.data.courses.map(course => `
                            <div class="course-card">
                                <div class="course-code">${course.course_code}</div>
                                <h3>${course.course_name}</h3>
                                <p class="course-instructor">👨‍🏫 ${course.instructor_name}</p>
                                <p><strong>Quizzes:</strong> ${course.quizzes_submitted}/${course.total_quizzes}</p>
                                <p><small>Enrolled: ${new Date(course.enrolled_at).toLocaleDateString()}</small></p>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                enrolledCourses.innerHTML = `
                    <div class="success-message">
                        <p>You haven't enrolled in any courses yet.</p>
                        <button class="btn btn-primary" onclick="showPage('courses')">Browse Courses</button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Load enrolled courses error:', error);
        }
    } else {
        enrolledCourses.innerHTML = `
            <p>Welcome, ${currentUser.role}! Your dashboard features are coming soon.</p>
        `;
    }
}
