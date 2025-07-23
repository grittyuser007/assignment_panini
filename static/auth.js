// Authentication JavaScript
const API_BASE_URL = 'http://localhost:8000';

// Show/Hide Forms
function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Show Alert Messages
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.auth-form:not(.hidden)');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle Login
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('token', result.token);

            // Redirect based on role
            if (result.user.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }
        } else {
            showAlert(result.detail || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
});

// Handle Signup
document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const signupData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Account created successfully! Please login.', 'success');
            showLogin();
            document.getElementById('signupFormElement').reset();
        } else {
            showAlert(result.detail || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        if (userData.role === 'teacher') {
            window.location.href = 'teacher.html';
        } else {
            window.location.href = 'student.html';
        }
    }
});

// Logout function (used in other pages)
function logout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Clear local storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // Show logout message
            showAlert('Logging out...', 'info');

            // Small delay for UX, then redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);

        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if there's an error
            window.location.href = 'index.html';
        }
    }
}
