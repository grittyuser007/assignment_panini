// Teacher Portal JavaScript
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

    if (currentUser.role !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }

    // Update UI with teacher name
    document.getElementById('teacherName').textContent = `Welcome, ${currentUser.name}`;

    // Load data
    loadAssignments();
    loadSubmissions();

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
    showSection('create-assignment');
});

// Initialize Sidebar functionality
function initializeSidebar() {
    // Set initial active state for the first section
    updateSidebarActiveLink('create-assignment');
}// Show specific section and hide others
function showSection(sectionId) {
    // List of all section IDs and their titles
    const sectionTitles = {
        'create-assignment': 'Create New Assignment',
        'assignments-list': 'My Assignments',
        'submissions-list': 'Student Submissions'
    };

    const allSections = ['create-assignment', 'assignments-list', 'submissions-list'];

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
}// Refresh all data
function refreshData() {
    showAlert('Refreshing data...', 'info');

    // Remember current active section
    const currentActiveLink = document.querySelector('.sidebar-link.active');
    let currentSection = 'create-assignment'; // default

    if (currentActiveLink) {
        const onclickAttr = currentActiveLink.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('assignments-list')) {
            currentSection = 'assignments-list';
        } else if (onclickAttr && onclickAttr.includes('submissions-list')) {
            currentSection = 'submissions-list';
        }
    }

    // Reload data
    loadAssignments();
    loadSubmissions();
    updateStats();

    // Stay on current section after refresh
    setTimeout(() => {
        showSection(currentSection);
    }, 500);
}

// Update sidebar stats
function updateStats() {
    // This will be called after loading assignments and submissions
    const assignmentCards = document.querySelectorAll('#assignmentsList .assignment-card');
    const submissionCards = document.querySelectorAll('#submissionsList .submission-card');

    document.getElementById('totalAssignmentsStat').textContent = assignmentCards.length;
    document.getElementById('totalSubmissionsStat').textContent = submissionCards.length;
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
});// Show Alert Messages
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

// Handle Assignment Creation
document.getElementById('assignmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Assignment created successfully!', 'success');
            document.getElementById('assignmentForm').reset();
            loadAssignments();

            // Stay on create assignment section after creating
            setTimeout(() => {
                showSection('create-assignment');
            }, 500);
        } else {
            showAlert(result.detail || 'Failed to create assignment', 'error');
        }
    } catch (error) {
        console.error('Assignment creation error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
});

// Load Teacher's Assignments
async function loadAssignments() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/teacher/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const assignments = await response.json();
            displayAssignments(assignments);
        } else {
            showAlert('Failed to load assignments', 'error');
        }
    } catch (error) {
        console.error('Load assignments error:', error);
        showAlert('Network error loading assignments', 'error');
    }
}

// Display Assignments
function displayAssignments(assignments) {
    const container = document.getElementById('assignmentsList');

    if (assignments.length === 0) {
        container.innerHTML = '<p class="text-center">No assignments created yet.</p>';
    } else {
        container.innerHTML = assignments.map(assignment => `
            <div class="assignment-card">
                <div class="assignment-header">
                    <h3 class="assignment-title">${assignment.title}</h3>
                    <span class="status-badge status-${assignment.status || 'active'}">${assignment.status || 'Active'}</span>
                </div>
                <div class="assignment-meta">
                    <span>Created: ${new Date(assignment.created_at).toLocaleDateString()}</span>
                    <span>Due: ${new Date(assignment.due_date).toLocaleDateString()}</span>
                    <span>Submissions: ${assignment.submission_count || 0}</span>
                </div>
                <div class="assignment-description">
                    ${assignment.description}
                </div>
                <div class="assignment-actions">
                    <button onclick="viewAssignmentSubmissions(${assignment.id})" class="btn-primary">
                        View Submissions (${assignment.submission_count || 0})
                    </button>
                    <button onclick="deleteAssignment(${assignment.id})" class="btn-danger">Delete</button>
                    ${assignment.file_path ? `<a href="${API_BASE_URL}/uploads/${assignment.file_path}" target="_blank" class="btn-secondary">Download File</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Update stats
    updateStats();
}// Load All Submissions
async function loadSubmissions() {
    try {
        const response = await fetch(`${API_BASE_URL}/submissions/teacher/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const submissions = await response.json();
            displaySubmissions(submissions);
        } else {
            showAlert('Failed to load submissions', 'error');
        }
    } catch (error) {
        console.error('Load submissions error:', error);
        showAlert('Network error loading submissions', 'error');
    }
}

// Display Submissions
function displaySubmissions(submissions) {
    const container = document.getElementById('submissionsList');

    if (submissions.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p>No submissions yet.</p>
                <button onclick="showSection('assignments-list')" class="btn-secondary">
                    📚 Go to Assignments
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="submissions-header">
                <div class="submissions-info">
                    <h3>📥 All Submissions</h3>
                    <span class="submissions-count">${submissions.length} total submission${submissions.length !== 1 ? 's' : ''}</span>
                </div>
                <button onclick="showSection('assignments-list')" class="btn-secondary">
                    📚 Back to Assignments
                </button>
            </div>
            ${submissions.map(submission => `
                <div class="submission-card">
                    <div class="assignment-header">
                        <div>
                            <h4>${submission.assignment_title}</h4>
                            <p><strong>Student:</strong> ${submission.student_name}</p>
                        </div>
                        <span class="status-badge status-submitted">Submitted</span>
                    </div>
                    <div class="assignment-meta">
                        <span>Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}</span>
                        <span>Student Email: ${submission.student_email}</span>
                    </div>
                    ${submission.notes ? `<div class="assignment-description"><strong>Notes:</strong> ${submission.notes}</div>` : ''}
                    <div class="assignment-actions">
                        <a href="${API_BASE_URL}/uploads/${submission.file_path}" target="_blank" class="btn-primary">
                            Download Submission
                        </a>
                    </div>
                </div>
            `).join('')}
        `;
    }

    // Update stats
    updateStats();
}// View Submissions for Specific Assignment
async function viewAssignmentSubmissions(assignmentId) {
    try {
        // First, navigate to the submissions section
        showSection('submissions-list');

        // Show loading state
        const container = document.getElementById('submissionsList');
        container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading submissions...</div>';

        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submissions`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const submissions = await response.json();

            // Display filtered submissions with assignment context
            displayFilteredSubmissions(submissions, assignmentId);

        } else {
            showAlert('Failed to load assignment submissions', 'error');
        }
    } catch (error) {
        console.error('Load assignment submissions error:', error);
        showAlert('Network error loading submissions', 'error');
    }
}

// Display filtered submissions for specific assignment
function displayFilteredSubmissions(submissions, assignmentId) {
    const container = document.getElementById('submissionsList');

    if (submissions.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p>No submissions for this assignment yet.</p>
                <button onclick="loadSubmissions(); showSection('submissions-list');" class="btn-secondary">
                    View All Submissions
                </button>
            </div>
        `;
        return;
    }

    // Add a header showing it's filtered
    const assignmentTitle = submissions[0]?.assignment_title || 'Assignment';

    container.innerHTML = `
        <div class="filter-header">
            <div class="filter-info">
                <h3>📋 Submissions for: ${assignmentTitle}</h3>
                <span class="filter-count">${submissions.length} submission${submissions.length !== 1 ? 's' : ''}</span>
            </div>
            <button onclick="loadSubmissions(); showSection('submissions-list');" class="btn-secondary">
                Show All Submissions
            </button>
        </div>
        ${submissions.map(submission => `
            <div class="submission-card">
                <div class="assignment-header">
                    <div>
                        <h4>${submission.assignment_title}</h4>
                        <p><strong>Student:</strong> ${submission.student_name}</p>
                    </div>
                    <span class="status-badge status-submitted">Submitted</span>
                </div>
                <div class="assignment-meta">
                    <span>Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}</span>
                    <span>Student Email: ${submission.student_email}</span>
                </div>
                ${submission.notes ? `<div class="assignment-description"><strong>Notes:</strong> ${submission.notes}</div>` : ''}
                <div class="assignment-actions">
                    <a href="${API_BASE_URL}/uploads/${submission.file_path}" target="_blank" class="btn-primary">
                        Download Submission
                    </a>
                </div>
            </div>
        `).join('')}
    `;

    // Update stats
    updateStats();
}

// Delete Assignment
async function deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showAlert('Assignment deleted successfully!', 'success');
            loadAssignments();
            loadSubmissions();
        } else {
            showAlert('Failed to delete assignment', 'error');
        }
    } catch (error) {
        console.error('Delete assignment error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
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
            window.location.href = 'index.html';
        }
    }
}
