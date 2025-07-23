// Student Portal JavaScript
const API_BASE_URL = 'http://localhost:8000';

let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!user || !token) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(user);

    if (currentUser.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    // Update UI with student name
    document.getElementById('studentName').textContent = `Welcome, ${currentUser.name}`;

    // Load data
    loadAvailableAssignments();
    loadMySubmissions();
    loadStudentProfile();

    // Add keyboard shortcut for logout (Ctrl+L)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            logout();
        }
    });

    // Initialize sidebar
    initializeSidebar();

    // Show only the first section by default
    showSection('available-assignments');
});

// Initialize Sidebar functionality
function initializeSidebar() {
    // Set initial active state for the first section
    updateSidebarActiveLink('available-assignments');
}

// Show specific section and hide others
function showSection(sectionId) {
    // List of all section IDs and their titles
    const sectionTitles = {
        'available-assignments': 'Available Assignments',
        'my-submissions': 'My Submissions',
        'student-profile': 'My Profile',
        'submission-form': 'Submit Assignment'
    };

    const allSections = ['available-assignments', 'my-submissions', 'student-profile', 'submission-form'];

    // Hide all sections first
    allSections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
            section.classList.remove('section-active');
        }
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('section-active');

        // Update section title indicator
        const titleElement = document.getElementById('currentSectionTitle');
        if (titleElement) {
            titleElement.textContent = sectionTitles[sectionId] || 'Section';
        }

        // Scroll to top of main content smoothly
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // Update active sidebar link
    updateSidebarActiveLink(sectionId);

    // Close mobile sidebar if open
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('open');
    }
}

// Scroll to section and update active nav (Updated)
function scrollToSection(sectionId) {
    // Use showSection instead of scrollIntoView
    showSection(sectionId);
}

// Update active sidebar link
function updateSidebarActiveLink(activeId) {
    // Remove active class from all links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to current link
    const activeLink = document.querySelector(`[onclick*="${activeId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Special handling for submission-form (not in sidebar, so keep available-assignments active)
    if (activeId === 'submission-form') {
        const availableLink = document.querySelector(`[onclick*="available-assignments"]`);
        if (availableLink) {
            availableLink.classList.add('active');
        }
    }
}

// Refresh all data
function refreshData() {
    showAlert('Refreshing data...', 'info');

    // Remember current active section
    const currentActiveLink = document.querySelector('.sidebar-link.active');
    let currentSection = 'available-assignments'; // default

    if (currentActiveLink) {
        const onclickAttr = currentActiveLink.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('my-submissions')) {
            currentSection = 'my-submissions';
        } else if (onclickAttr && onclickAttr.includes('student-profile')) {
            currentSection = 'student-profile';
        }
    }

    // Reload data
    loadAvailableAssignments();
    loadMySubmissions();
    loadStudentProfile();
    updateStats();

    // Stay on current section after refresh
    setTimeout(() => {
        showSection(currentSection);
    }, 500);
}

// Update sidebar stats
function updateStats() {
    // This will be called after loading data
    const availableCards = document.querySelectorAll('#availableAssignments .assignment-card');
    const submissionCards = document.querySelectorAll('#mySubmissions .submission-card');

    // Get completed count from profile stats
    const completedElement = document.getElementById('completedAssignments');
    const totalElement = document.getElementById('totalAssignments');

    const completed = completedElement ? parseInt(completedElement.textContent) || 0 : 0;
    const total = totalElement ? parseInt(totalElement.textContent) || 0 : 0;

    document.getElementById('availableAssignmentsStat').textContent = total;
    document.getElementById('completedAssignmentsStat').textContent = completed;
    document.getElementById('pendingAssignmentsStat').textContent = total - completed;
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.sidebar-toggle');

    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// Show Alert Messages
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.dashboard');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Get auth headers
function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
}

// Load Available Assignments
async function loadAvailableAssignments() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const assignments = await response.json();
            displayAvailableAssignments(assignments);
            updateStats(); // Update sidebar stats
        } else {
            showAlert('Failed to load assignments', 'error');
        }
    } catch (error) {
        console.error('Load assignments error:', error);
        showAlert('Network error loading assignments', 'error');
    }
}

// Display Available Assignments
function displayAvailableAssignments(assignments) {
    const container = document.getElementById('availableAssignments');

    if (assignments.length === 0) {
        container.innerHTML = '<p class="text-center">No assignments available.</p>';
        return;
    }

    container.innerHTML = assignments.map(assignment => {
        const dueDate = new Date(assignment.due_date);
        const now = new Date();
        const isOverdue = dueDate < now;
        const hasSubmitted = assignment.has_submitted;

        return `
            <div class="assignment-card">
                <div class="assignment-header">
                    <h3 class="assignment-title">${assignment.title}</h3>
                    <span class="status-badge status-${hasSubmitted ? 'completed' : (isOverdue ? 'overdue' : 'pending')}">
                        ${hasSubmitted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending')}
                    </span>
                </div>
                <div class="assignment-meta">
                    <span>Teacher: ${assignment.teacher_name}</span>
                    <span>Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}</span>
                    <span class="${isOverdue && !hasSubmitted ? 'text-danger' : ''}">
                        ${isOverdue && !hasSubmitted ? 'OVERDUE!' : ''}
                    </span>
                </div>
                <div class="assignment-description">
                    ${assignment.description}
                </div>
                <div class="assignment-actions">
                    ${!hasSubmitted ? `
                        <button onclick="showSubmissionForm(${assignment.id}, '${assignment.title}')" class="btn-primary">
                            Submit Assignment
                        </button>
                    ` : `
                        <span class="text-success">✓ Already Submitted</span>
                    `}
                    ${assignment.file_path ? `
                        <a href="${API_BASE_URL}/uploads/${assignment.file_path}" target="_blank" class="btn-secondary">
                            Download Assignment File
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Show Submission Form
function showSubmissionForm(assignmentId, assignmentTitle) {
    document.getElementById('assignmentId').value = assignmentId;

    // Navigate to the submission form section
    showSection('submission-form');

    // Update form title
    document.querySelector('#submission-form h2').textContent = `Submit Assignment: ${assignmentTitle}`;

    // Reset the form
    document.getElementById('submissionForm').reset();
    document.getElementById('assignmentId').value = assignmentId; // Set again after reset
}

// Cancel Submission
function cancelSubmission() {
    // Reset the form
    document.getElementById('submissionForm').reset();

    // Navigate back to available assignments
    showSection('available-assignments');
}

// Handle Submission
document.getElementById('submissionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const response = await fetch(`${API_BASE_URL}/submissions/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Assignment submitted successfully!', 'success');
            // Reset form and navigate back to available assignments
            document.getElementById('submissionForm').reset();
            showSection('available-assignments');

            // Reload data to reflect changes
            loadAvailableAssignments();
            loadMySubmissions();
            loadStudentProfile();
        } else {
            showAlert(result.detail || 'Failed to submit assignment', 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
});

// Load My Submissions
async function loadMySubmissions() {
    try {
        const response = await fetch(`${API_BASE_URL}/submissions/my/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const submissions = await response.json();
            displayMySubmissions(submissions);
            updateStats(); // Update sidebar stats
        } else {
            showAlert('Failed to load submissions', 'error');
        }
    } catch (error) {
        console.error('Load submissions error:', error);
        showAlert('Network error loading submissions', 'error');
    }
}

// Display My Submissions
function displayMySubmissions(submissions) {
    const container = document.getElementById('mySubmissions');

    if (submissions.length === 0) {
        container.innerHTML = '<p class="text-center">No submissions yet.</p>';
        return;
    }

    container.innerHTML = submissions.map(submission => `
        <div class="submission-card">
            <div class="assignment-header">
                <div>
                    <h4>${submission.assignment_title}</h4>
                    <p><strong>Teacher:</strong> ${submission.teacher_name}</p>
                </div>
                <span class="status-badge status-submitted">Submitted</span>
            </div>
            <div class="assignment-meta">
                <span>Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}</span>
                <span>Due Date: ${new Date(submission.assignment_due_date).toLocaleDateString()}</span>
            </div>
            ${submission.notes ? `<div class="assignment-description"><strong>Notes:</strong> ${submission.notes}</div>` : ''}
            <div class="assignment-actions">
                <a href="${API_BASE_URL}/uploads/${submission.file_path}" target="_blank" class="btn-primary">
                    Download My Submission
                </a>
            </div>
        </div>
    `).join('');
}

// Load Student Profile
async function loadStudentProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/students/profile/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const profile = await response.json();
            displayStudentProfile(profile);
            updateStats(); // Update sidebar stats
        } else {
            showAlert('Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Load profile error:', error);
        showAlert('Network error loading profile', 'error');
    }
}

// Display Student Profile
function displayStudentProfile(profile) {
    // Update stats
    document.getElementById('totalAssignments').textContent = profile.total_assignments;
    document.getElementById('completedAssignments').textContent = profile.completed_assignments;
    document.getElementById('pendingAssignments').textContent = profile.pending_assignments;

    // Display teachers and their assignments
    const teachersContainer = document.getElementById('teachersList');

    if (profile.teachers_assignments.length === 0) {
        teachersContainer.innerHTML = '<h3>Work from Different Teachers:</h3><p>No assignments from any teachers yet.</p>';
        return;
    }

    const teachersHTML = profile.teachers_assignments.map(teacher => `
        <div class="teacher-group">
            <div class="teacher-name">👨‍🏫 ${teacher.teacher_name}</div>
            <div class="teacher-assignments">
                ${teacher.assignments.map(assignment => `
                    <span class="assignment-tag ${assignment.completed ? 'completed' : 'pending'}">
                        ${assignment.title} ${assignment.completed ? '✓' : '⏳'}
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');

    teachersContainer.innerHTML = `
        <h3>Work from Different Teachers:</h3>
        ${teachersHTML}
    `;
}

// Logout function
function logout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Show logout message
            showAlert('Logging out...', 'info');

            // Optional: Call server logout endpoint
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(err => console.log('Logout API call failed:', err));
            }

            // Clear local storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // Small delay for UX, then redirect
            setTimeout(() => {
                window.location.href = '/';
            }, 500);

        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if there's an error
            window.location.href = '/';
        }
    }
}
