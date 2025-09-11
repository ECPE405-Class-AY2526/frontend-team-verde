
// Database simulation using JavaScript objects (in-memory storage)
let userDatabase = {};
let currentUser = null;

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageId).classList.add('active');
}

// Enhanced User Management System
class UserManager {
    constructor() {
        this.loadUsersFromStorage();
        this.loadCurrentSession();
    }

    // Load all registered users from localStorage
    loadUsersFromStorage() {
        const storedUsers = localStorage.getItem('verdeIntelUsers');
        if (storedUsers) {
            userDatabase = JSON.parse(storedUsers);
        } else {
            userDatabase = {};
        }
    }

    // Save all users to localStorage
    saveUsersToStorage() {
        localStorage.setItem('verdeIntelUsers', JSON.stringify(userDatabase));
    }

    // Load current user session
    loadCurrentSession() {
        const sessionData = localStorage.getItem('verdeIntelSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.isLoggedIn && session.userEmail) {
                currentUser = userDatabase[session.userEmail];
                if (currentUser) {
                    this.showDashboard(currentUser);
                }
            }
        }
    }

    // Save current session
    saveCurrentSession(user, isLoggedIn = true) {
        const sessionData = {
            isLoggedIn: isLoggedIn,
            userEmail: user ? user.email : null,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('verdeIntelSession', JSON.stringify(sessionData));
    }

    // Register new user
    registerUser(userData) {
        const { name, email, password } = userData;

        // Check if user already exists
        if (userDatabase[email]) {
            throw new Error('User with this email already exists!');
        }

        // Create new user object
        const newUser = {
            name: name,
            email: email,
            password: password, // In production, this should be hashed
            registrationDate: new Date().toISOString(),
            lastLogin: null
        };

        // Add to database
        userDatabase[email] = newUser;
        this.saveUsersToStorage();

        return newUser;
    }

    // Login user
    loginUser(email, password) {
        const user = userDatabase[email];

        if (!user) {
            throw new Error('User not found!');
        }

        if (user.password !== password) {
            throw new Error('Invalid password!');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsersToStorage();

        // Set current user and save session
        currentUser = user;
        this.saveCurrentSession(user, true);

        return user;
    }

    // Logout user
    logoutUser() {
        currentUser = null;
        this.saveCurrentSession(null, false);
    }

    // Show dashboard with user info
    showDashboard(user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;

        // Set user icon to first letter of name
        const userIcon = document.getElementById('userIcon');
        if (userIcon) {
            userIcon.textContent = user.name.charAt(0).toUpperCase();
        }

        showPage('dashboard');
    }

    // Get current user
    getCurrentUser() {
        return currentUser;
    }

    // Get all users (for debugging)
    getAllUsers() {
        return userDatabase;
    }
}

// Initialize user manager
const userManager = new UserManager();

// Handle signup
async function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!name || !email || !password) {
        alert('Please fill in all fields!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }

    try {
        // Register user in local database
        const newUser = userManager.registerUser({ name, email, password });

        // Also try to save to Firebase if available
        if (typeof window.saveUserToDB === 'function') {
            try {
                await window.saveUserToDB(newUser);
                console.log('✅ User also saved to Firebase');
            } catch (e) {
                console.warn('⚠️ Could not save to Firebase:', e.message);
            }
        }

        alert(`Account created successfully for ${name}!`);

        // Auto-login the new user
        currentUser = newUser;
        userManager.saveCurrentSession(newUser, true);
        userManager.showDashboard(newUser);

    } catch (error) {
        alert('Error: ' + error.message);
    }
}


// Logout function
function logout() {
    userManager.logoutUser();
    alert("You have been logged out!");
    showPage('home');
    document.getElementById('userMenu').style.display = 'none';
}

// Toggle user menu
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const profile = document.querySelector('.user-profile');
    const menu = document.getElementById('userMenu');
    if (menu && profile && !profile.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
    }
});

// Debug function to check users (remove in production)
function debugUsers() {
    console.log('All registered users:', userManager.getAllUsers());
    console.log('Current user:', userManager.getCurrentUser());
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in and show dashboard
    const currentUser = userManager.getCurrentUser();
    if (currentUser) {
        console.log('Auto-login successful for:', currentUser.name);
        userManager.showDashboard(currentUser);
    }
});
