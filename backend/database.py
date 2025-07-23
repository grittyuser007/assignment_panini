import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path

DATABASE_FILE = "edutrack.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_db():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Assignments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            due_date TIMESTAMP NOT NULL,
            teacher_id INTEGER NOT NULL,
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Submissions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignment_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            notes TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(assignment_id, student_id)
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id)')
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

# Database helper functions
class UserDB:
    @staticmethod
    def create_user(name: str, email: str, password: str, role: str):
        """Create a new user"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            password_hash = hash_password(password)
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                (name, email, password_hash, role)
            )
            user_id = cursor.lastrowid
            conn.commit()
            return user_id
        except sqlite3.IntegrityError:
            raise ValueError("Email already exists")
        finally:
            conn.close()
    
    @staticmethod
    def get_user_by_email(email: str):
        """Get user by email"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()
        
        return dict(user) if user else None
    
    @staticmethod
    def get_user_by_id(user_id: int):
        """Get user by ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        return dict(user) if user else None

class AssignmentDB:
    @staticmethod
    def create_assignment(title: str, description: str, due_date: str, teacher_id: int, file_path: str = None):
        """Create a new assignment"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO assignments (title, description, due_date, teacher_id, file_path) VALUES (?, ?, ?, ?, ?)",
            (title, description, due_date, teacher_id, file_path)
        )
        assignment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return assignment_id
    
    @staticmethod
    def get_assignments_by_teacher(teacher_id: int):
        """Get all assignments by teacher"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT a.*, 
                   COUNT(s.id) as submission_count
            FROM assignments a
            LEFT JOIN submissions s ON a.id = s.assignment_id
            WHERE a.teacher_id = ?
            GROUP BY a.id
            ORDER BY a.created_at DESC
        ''', (teacher_id,))
        
        assignments = cursor.fetchall()
        conn.close()
        
        return [dict(assignment) for assignment in assignments]
    
    @staticmethod
    def get_all_assignments():
        """Get all assignments with teacher info"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT a.*, u.name as teacher_name
            FROM assignments a
            JOIN users u ON a.teacher_id = u.id
            ORDER BY a.created_at DESC
        ''')
        
        assignments = cursor.fetchall()
        conn.close()
        
        return [dict(assignment) for assignment in assignments]
    
    @staticmethod
    def get_assignments_for_student(student_id: int):
        """Get assignments with submission status for student"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT a.*, u.name as teacher_name,
                   CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
            FROM assignments a
            JOIN users u ON a.teacher_id = u.id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
            ORDER BY a.due_date ASC
        ''', (student_id,))
        
        assignments = cursor.fetchall()
        conn.close()
        
        return [dict(assignment) for assignment in assignments]
    
    @staticmethod
    def delete_assignment(assignment_id: int, teacher_id: int):
        """Delete assignment (only by owner)"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "DELETE FROM assignments WHERE id = ? AND teacher_id = ?",
            (assignment_id, teacher_id)
        )
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted

class SubmissionDB:
    @staticmethod
    def create_submission(assignment_id: int, student_id: int, file_path: str, notes: str = None):
        """Create a new submission"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO submissions (assignment_id, student_id, file_path, notes) VALUES (?, ?, ?, ?)",
                (assignment_id, student_id, file_path, notes)
            )
            submission_id = cursor.lastrowid
            conn.commit()
            return submission_id
        except sqlite3.IntegrityError:
            raise ValueError("Assignment already submitted")
        finally:
            conn.close()
    
    @staticmethod
    def get_submissions_by_teacher(teacher_id: int):
        """Get all submissions for teacher's assignments"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.*, a.title as assignment_title, u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN users u ON s.student_id = u.id
            WHERE a.teacher_id = ?
            ORDER BY s.submitted_at DESC
        ''', (teacher_id,))
        
        submissions = cursor.fetchall()
        conn.close()
        
        return [dict(submission) for submission in submissions]
    
    @staticmethod
    def get_submissions_by_student(student_id: int):
        """Get all submissions by student"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.*, a.title as assignment_title, a.due_date as assignment_due_date,
                   u.name as teacher_name
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN users u ON a.teacher_id = u.id
            WHERE s.student_id = ?
            ORDER BY s.submitted_at DESC
        ''', (student_id,))
        
        submissions = cursor.fetchall()
        conn.close()
        
        return [dict(submission) for submission in submissions]
    
    @staticmethod
    def get_submissions_by_assignment(assignment_id: int):
        """Get all submissions for specific assignment"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.*, a.title as assignment_title, u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN users u ON s.student_id = u.id
            WHERE s.assignment_id = ?
            ORDER BY s.submitted_at DESC
        ''', (assignment_id,))
        
        submissions = cursor.fetchall()
        conn.close()
        
        return [dict(submission) for submission in submissions]

class StudentDB:
    @staticmethod
    def get_student_profile(student_id: int):
        """Get student profile with statistics"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total assignments
        cursor.execute("SELECT COUNT(*) as total FROM assignments")
        total_assignments = cursor.fetchone()['total']
        
        # Get completed assignments
        cursor.execute(
            "SELECT COUNT(*) as completed FROM submissions WHERE student_id = ?",
            (student_id,)
        )
        completed_assignments = cursor.fetchone()['completed']
        
        # Get teachers and their assignments
        cursor.execute('''
            SELECT u.name as teacher_name, 
                   a.title as assignment_title,
                   CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as completed
            FROM users u
            JOIN assignments a ON u.id = a.teacher_id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
            WHERE u.role = 'teacher'
            ORDER BY u.name, a.title
        ''', (student_id,))
        
        teacher_assignments = cursor.fetchall()
        conn.close()
        
        # Group by teacher
        teachers_dict = {}
        for row in teacher_assignments:
            teacher_name = row['teacher_name']
            if teacher_name not in teachers_dict:
                teachers_dict[teacher_name] = []
            
            teachers_dict[teacher_name].append({
                'title': row['assignment_title'],
                'completed': bool(row['completed'])
            })
        
        teachers_assignments = [
            {
                'teacher_name': teacher,
                'assignments': assignments
            }
            for teacher, assignments in teachers_dict.items()
        ]
        
        return {
            'total_assignments': total_assignments,
            'completed_assignments': completed_assignments,
            'pending_assignments': total_assignments - completed_assignments,
            'teachers_assignments': teachers_assignments
        }
