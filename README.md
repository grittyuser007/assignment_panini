# EduTrack - Assignment Management System
## Internship Project Submission

**Project Name:** EduTrack - Assignment Management System    
**Technology Stack:** FastAPI, SQLite, HTML/CSS, JavaScript  

---

## 📋 Project Overview

EduTrack is a comprehensive assignment tracking system designed for EdTech platforms that facilitates seamless interaction between teachers and students. The system allows teachers to create and manage assignments while enabling students to submit their work through an intuitive web interface.

### 🎯 Project Objectives
- Create a scalable assignment management platform
- Implement role-based authentication and authorization
- Provide intuitive user interfaces for both teachers and students
- Enable secure file upload and management
- Demonstrate full-stack development capabilities

---

## 🏗️ System Architecture

### Core Technology Stack
- **Backend:** FastAPI (Python) with modular architecture
- **Database:** SQLite with optimized indexing
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Authentication:** JWT (JSON Web Tokens) with role-based access
- **File Storage:** Local file system with organized directory structure

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │    Database     │
│   (HTML/CSS/JS) │◄──►│   (FastAPI)     │◄──►│    (SQLite)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Student Portal  │    │ Authentication  │    │ File Storage    │
│ Teacher Portal  │    │ API Endpoints   │    │ (Uploads)       │
│ Login System    │    │ Role Management │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📊 Core Entities and Relationships

### Entity Relationship Diagram

```
Users                    Assignments                Submissions
┌──────────────┐        ┌──────────────┐          ┌──────────────┐
│ id (PK)      │        │ id (PK)      │          │ id (PK)      │
│ name         │    1   │ title        │      1   │ assignment_id│
│ email        │ ─────► │ description  │ ◄─────── │ (FK)         │
│ password_hash│    n   │ due_date     │      n   │ student_id   │
│ role         │        │ teacher_id   │          │ (FK)         │
│ created_at   │        │ (FK)         │          │ file_path    │
└──────────────┘        │ file_path    │          │ notes        │
                        │ created_at   │          │ submitted_at │
                        └──────────────┘          └──────────────┘
```

### Detailed Entity Specifications

| **Entity** | **Attributes** | **Type** | **Constraints** | **Purpose** |
|------------|----------------|----------|-----------------|-------------|
| **Users** | id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| | name | TEXT | NOT NULL | User's full name |
| | email | TEXT | UNIQUE, NOT NULL | Login credential |
| | password_hash | TEXT | NOT NULL | Encrypted password |
| | role | TEXT | CHECK (teacher/student) | Access control |
| | created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| **Assignments** | id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| | title | TEXT | NOT NULL | Assignment name |
| | description | TEXT | NOT NULL | Assignment details |
| | due_date | TIMESTAMP | NOT NULL | Submission deadline |
| | teacher_id | INTEGER | FOREIGN KEY → users(id) | Assignment creator |
| | file_path | TEXT | NULLABLE | Attached assignment file |
| | created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| **Submissions** | id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| | assignment_id | INTEGER | FOREIGN KEY → assignments(id) | Related assignment |
| | student_id | INTEGER | FOREIGN KEY → users(id) | Submitting student |
| | file_path | TEXT | NOT NULL | Submitted file location |
| | notes | TEXT | NULLABLE | Student's additional notes |
| | submitted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission time |

### Database Relationships
1. **Users → Assignments** (1:N): One teacher can create multiple assignments
2. **Assignments → Submissions** (1:N): One assignment can have multiple submissions
3. **Users → Submissions** (1:N): One student can submit multiple assignments
4. **Unique Constraint**: (assignment_id, student_id) - One submission per student per assignment

---

## 🔌 API Endpoints Documentation

### Authentication Endpoints

#### User Registration
```http
POST /auth/signup
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "role": "teacher"
}

Response:
{
    "message": "User created successfully",
    "user_id": 1
}
```

#### User Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "securepassword",
    "role": "teacher"
}

Response:
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "teacher"
    }
}
```

### Assignment Management Endpoints

#### Teacher Creates Assignment
```http
POST /assignments/
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- title: "Mathematics Quiz 1"
- description: "Complete all algebra problems"
- due_date: "2025-08-01T23:59:59"
- file: [optional assignment file]

Response:
{
    "message": "Assignment created successfully",
    "assignment_id": 15
}

Technical Implementation:
- Authentication: JWT token validation
- Authorization: Teacher role verification
- File Upload: Async file handling with unique naming
- Database: Assignment record creation with teacher association
```

#### Get Assignments (Role-based)
```http
GET /assignments/
Authorization: Bearer <jwt_token>

Teacher Response:
[
    {
        "id": 15,
        "title": "Mathematics Quiz 1",
        "description": "Complete all algebra problems",
        "due_date": "2025-08-01T23:59:59",
        "teacher_name": "John Doe",
        "file_path": "assignment_20250723_143022_quiz.pdf",
        "submission_count": 5
    }
]

Student Response:
[
    {
        "id": 15,
        "title": "Mathematics Quiz 1",
        "description": "Complete all algebra problems",
        "due_date": "2025-08-01T23:59:59",
        "teacher_name": "John Doe",
        "file_path": "assignment_20250723_143022_quiz.pdf",
        "has_submitted": false
    }
]
```

### Submission Management Endpoints

#### Student Submits Assignment
```http
POST /submissions/
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- assignment_id: 15
- file: [student's submission file]
- notes: "Optional additional notes"

Response:
{
    "message": "Assignment submitted successfully",
    "submission_id": 42
}

Technical Implementation:
- Authentication: JWT token validation
- Authorization: Student role verification
- File Upload: Secure file handling with unique naming convention
- Validation: Prevents duplicate submissions per student/assignment
- Database: Submission record creation with timestamp
```

#### Teacher Views Submissions
```http
GET /submissions/assignment/15
Authorization: Bearer <jwt_token>

Response:
[
    {
        "id": 42,
        "assignment_id": 15,
        "assignment_title": "Mathematics Quiz 1",
        "student_id": 3,
        "student_name": "Alice Johnson",
        "student_email": "alice@student.com",
        "file_path": "submission_s3_a15_20250723_150045_solution.pdf",
        "notes": "Completed all problems with explanations",
        "submitted_at": "2025-07-23T15:00:45",
        "assignment_due_date": "2025-08-01T23:59:59"
    }
]

Technical Implementation:
- Authentication: JWT token validation
- Authorization: Teacher role verification
- Data Joining: Complex query joining submissions, assignments, and users
- Filtering: Returns only submissions for teacher's assignments
```

---

## 🔐 Authentication Strategy

### JWT-Based Authentication System

#### Token Structure
```javascript
{
    "user_id": 1,
    "email": "user@example.com",
    "role": "teacher",
    "exp": 1690128000  // 24-hour expiration
}
```

#### Role-Based Access Control (RBAC)

| **Role** | **Permissions** | **Accessible Endpoints** |
|----------|----------------|---------------------------|
| **Teacher** | - Create assignments<br>- View all submissions<br>- Manage own assignments | `/assignments/` (POST)<br>`/assignments/teacher/`<br>`/submissions/teacher/`<br>`/submissions/assignment/{id}` |
| **Student** | - View available assignments<br>- Submit assignments<br>- View own submissions | `/assignments/` (GET)<br>`/submissions/` (POST)<br>`/submissions/my/`<br>`/students/profile/` |

#### Security Implementation
1. **Password Security**: SHA-256 hashing with secure storage
2. **Token Management**: 24-hour expiration with secure secret key
3. **Role Verification**: Middleware-based role checking
4. **Input Validation**: Pydantic models for request validation
5. **File Security**: Sanitized file names and type validation

#### Authentication Flow
```
1. User submits credentials
2. Server validates against database
3. JWT token generated with user info
4. Token sent to client
5. Client includes token in headers
6. Server validates token for each request
7. Role-based access granted/denied
```

---

## 📁 Project Structure

```
submission_panini/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Main application entry point
│   ├── auth.py                # Authentication endpoints
│   ├── assignments.py         # Assignment management
│   ├── submissions.py         # Submission handling
│   ├── students.py            # Student-specific endpoints
│   └── database.py            # Database operations
├── frontend/                   # Frontend Templates
│   ├── index.html             # Login/Registration page
│   ├── teacher.html           # Teacher portal
│   └── student.html           # Student portal
├── static/                     # Static Assets
│   ├── style.css              # Application styling
│   ├── auth.js                # Authentication logic
│   ├── teacher.js             # Teacher portal functionality
│   └── student.js             # Student portal functionality
├── uploads/                    # File Storage
│   ├── assignments/           # Assignment files
│   └── submissions/           # Student submissions
└── README.md                  # Documentation
```

---

## 🚀 Future Scalability Recommendations

### Immediate Improvements (Phase 1)
1. **Database Migration**
   - **Current:** SQLite (development)
   - **Recommended:** PostgreSQL/MySQL (production)
   - **Benefits:** Better concurrency, advanced features, data integrity

2. **Cloud Storage Integration**
   - **Current:** Local file system
   - **Recommended:** AWS S3, Google Cloud Storage
   - **Benefits:** Scalable storage, CDN integration, backup/recovery

3. **Enhanced Security**
   - **Environment Variables:** Move secrets to environment configuration
   - **Rate Limiting:** Implement API rate limiting
   - **Input Sanitization:** Advanced XSS/SQL injection protection

### Medium-term Enhancements (Phase 2)
1. **Microservices Architecture**
   ```
   Current Monolith → Microservices
   ┌─────────────────┐    ┌─────────────────┐
   │   Single API    │ →  │ Auth Service    │
   │   (FastAPI)     │    │ Assignment Srv  │
   │                 │    │ Notification    │
   └─────────────────┘    └─────────────────┘
   ```

2. **Caching Layer**
   - **Redis:** Session management, API response caching
   - **Benefits:** Improved performance, reduced database load

3. **Real-time Features**
   - **WebSocket Integration:** Live notifications
   - **Server-Sent Events:** Real-time updates

### Long-term Scalability (Phase 3)
1. **Containerization & Orchestration**
   ```dockerfile
   # Docker containerization
   FROM python:3.9
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
   ```

2. **Load Balancing & CDN**
   - **Application:** Multiple server instances
   - **Database:** Read replicas, connection pooling
   - **Static Assets:** CDN distribution

3. **Advanced Features**
   - **Analytics Dashboard:** Usage statistics, performance metrics
   - **Mobile App:** React Native/Flutter application
   - **AI Integration:** Automated grading, plagiarism detection

### Performance Optimization Strategy
| **Metric** | **Current** | **Target** | **Solution** |
|------------|-------------|------------|--------------|
| Response Time | <500ms | <200ms | Caching, Database optimization |
| Concurrent Users | 50 | 1000+ | Load balancing, Auto-scaling |
| File Upload | 10MB | 100MB | Cloud storage, Streaming uploads |
| Database Queries | Basic | Optimized | Indexing, Query optimization |

---

## 🛠️ Development Setup

### Prerequisites
- Python 3.8+
- FastAPI
- SQLite
- Modern web browser

### Installation Steps
```bash
# Clone the repository
git clone <repository-url>
cd submission_panini

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[bcrypt]

# Run the application
cd backend
uvicorn main:app --reload

# Access the application
# Open browser: http://localhost:8000
```

### Testing Credentials
```
Teacher Account:
- Email: teacher@test.com
- Password: teacher123

Student Account:
- Email: student@test.com
- Password: student123
```

---

## 📈 Technical Achievements

### Key Features Implemented
- ✅ Role-based authentication system
- ✅ File upload/download functionality
- ✅ Responsive UI with sidebar navigation
- ✅ RESTful API design
- ✅ Database relationships and constraints
- ✅ Error handling and validation
- ✅ Security best practices

### Code Quality Metrics
- **Backend:** Modular architecture with separated concerns
- **Frontend:** Vanilla JavaScript with proper event handling
- **Database:** Normalized schema with optimized indexes
- **Security:** JWT authentication with role-based access
- **Documentation:** Comprehensive API documentation

---

## 🎯 Learning Outcomes

This internship project demonstrates proficiency in:
- **Full-stack Development:** End-to-end application development
- **API Design:** RESTful services with proper HTTP methods
- **Database Design:** Relational database modeling and optimization
- **Security Implementation:** Authentication and authorization
- **Frontend Development:** Responsive UI/UX design
- **Project Architecture:** Scalable system design principles

---

## 📞 Contact Information

**Developer:** [Your Name]  
**Email:** [your.email@example.com]  
**LinkedIn:** [your-linkedin-profile]  
**GitHub:** [your-github-profile]  

---

*This README.md serves as a comprehensive documentation for the EduTrack Assignment Management System developed as part of an internship project. The system demonstrates practical application of modern web development technologies and best practices in software engineering.*

### 👨‍🏫 Teacher Portal
- **Assignment Management**: Create, view, and delete assignments
- **File Upload**: Attach files to assignments
- **Submission Tracking**: View all student submissions
- **Student Overview**: See who submitted each assignment

### 👨‍🎓 Student Portal
- **Assignment View**: See all available assignments
- **File Submission**: Upload assignment files
- **Progress Tracking**: View submission status and completion
- **Teacher Overview**: See work from different teachers
- **Profile Statistics**: Track completed vs pending assignments

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Authentication**: JWT tokens
- **File Storage**: Local file system

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Quick Start

1. **Clone/Download the project**
   ```bash
   # Navigate to the project directory
   cd submission_panini
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the Application**
   ```bash
   # Option 1: Use the batch file (Windows)
   ..\run.bat
   
   # Option 2: Run manually
   python main.py
   ```

4. **Access the Application**
   - Open your browser and go to: `http://localhost:8000`
   - The system will automatically initialize the database on first run

## Project Structure

```
submission_panini/
├── frontend/
│   ├── index.html          # Login/Signup page
│   ├── teacher.html        # Teacher portal
│   └── student.html        # Student portal
├── static/
│   ├── style.css          # CSS styling
│   ├── auth.js            # Authentication logic
│   ├── teacher.js         # Teacher portal logic
│   └── student.js         # Student portal logic
├── backend/
│   ├── main.py            # FastAPI main application
│   ├── auth.py            # Authentication endpoints
│   ├── assignments.py     # Assignment management
│   ├── submissions.py     # Submission handling
│   ├── students.py        # Student profile endpoints
│   ├── database.py        # Database models and operations
│   └── requirements.txt   # Python dependencies
├── uploads/               # File storage directory
└── run.bat               # Windows startup script
```

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Assignments
- `POST /assignments/` - Create assignment (Teacher)
- `GET /assignments/` - Get assignments (Role-based)
- `GET /assignments/teacher/` - Get teacher's assignments
- `DELETE /assignments/{id}` - Delete assignment (Teacher)

### Submissions
- `POST /submissions/` - Submit assignment (Student)
- `GET /submissions/my/` - Get student's submissions
- `GET /submissions/teacher/` - Get teacher's submissions

### Students
- `GET /students/profile/` - Get student profile and stats

## Database Schema

### Users Table
- `id` (Primary Key)
- `name` (Text)
- `email` (Unique)
- `password_hash` (Text)
- `role` (teacher/student)
- `created_at` (Timestamp)

### Assignments Table
- `id` (Primary Key)
- `title` (Text)
- `description` (Text)
- `due_date` (Timestamp)
- `teacher_id` (Foreign Key)
- `file_path` (Optional)
- `created_at` (Timestamp)

### Submissions Table
- `id` (Primary Key)
- `assignment_id` (Foreign Key)
- `student_id` (Foreign Key)
- `file_path` (Text)
- `notes` (Optional)
- `submitted_at` (Timestamp)

## Usage Guide

### For Teachers:
1. **Sign Up** as a teacher
2. **Create Assignments** with descriptions and due dates
3. **Attach Files** (optional) to assignments
4. **View Submissions** from students
5. **Track Progress** of student participation

### For Students:
1. **Sign Up** as a student
2. **View Available Assignments** from all teachers
3. **Submit Work** by uploading files
4. **Track Progress** in your profile
5. **View Completion Status** for each assignment

## Security Features

- **Password Hashing**: SHA-256 encryption
- **JWT Authentication**: Secure token-based sessions
- **Role-based Access**: Separate permissions for teachers/students
- **File Upload Security**: Controlled file storage
- **CORS Protection**: Configurable cross-origin policies

## File Upload Support

Supported file types:
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`
- Archives: `.zip`
- Images: `.png`, `.jpg`, `.jpeg`

## Development Notes

- **Database**: Automatically initialized on first run
- **File Storage**: Files stored in `/uploads` directory
- **Environment**: Development mode with auto-reload
- **Logging**: Comprehensive error handling and logging

## Deployment Considerations

For production deployment:
1. Change the JWT secret key
2. Configure proper CORS origins
3. Use a production WSGI server (like Gunicorn)
4. Set up proper file storage (cloud storage)
5. Configure SSL/HTTPS
6. Use environment variables for sensitive data

## Troubleshooting

### Common Issues:

1. **Port 8000 already in use**
   - Change the port in `main.py` or stop other services

2. **File upload fails**
   - Check that `/uploads` directory exists and has write permissions

3. **Database errors**
   - Delete `edutrack.db` to reset the database

4. **CORS errors**
   - Check that the frontend is accessing the correct API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is created for educational purposes. Feel free to use and modify as needed.

---

**EduTrack** - Simplifying assignment management for educational institutions.
