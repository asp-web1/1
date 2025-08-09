// Authentication logic for SAGE
const AUTH_CONFIG = {
    username: 'asp',
    password: 'ese'
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dark mode
    initializeDarkMode();
    
    // Check if already logged in
    if (localStorage.getItem('sageAuth') === 'true') {
        // Only redirect if we're on the login page
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            window.location.href = '/dashboard/home.html';
        }
    }
    
    // Set up login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        // Add a test to ensure the form is working
        console.log('Login form found and event listener added');
    } else {
        console.error('Login form not found!');
    }
});

function initializeDarkMode() {
    try {
        // Check if dataManager is available (it might not be on login page)
        if (typeof dataManager !== 'undefined' && dataManager) {
            const settings = dataManager.getSettings();
            if (settings.darkMode) {
                document.body.classList.add('dark-mode');
            }
        } else {
            // Fallback: check localStorage directly for dark mode setting
            const sageData = localStorage.getItem('sageData');
            if (sageData) {
                try {
                    const data = JSON.parse(sageData);
                    if (data.settings && data.settings.darkMode) {
                        document.body.classList.add('dark-mode');
                    }
                } catch (e) {
                    console.log('Could not parse sageData for dark mode');
                }
            }
        }
    } catch (e) {
        console.log('Dark mode initialization failed:', e);
    }
}

function handleLogin(e) {
    e.preventDefault();
    console.log('Login function called'); // Debug log
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error-message');
    
    console.log('Username:', username, 'Password:', password); // Debug log
    
    // Validate inputs
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        errorDiv.className = 'error-visible';
        setTimeout(() => {
            errorDiv.className = 'error-hidden';
        }, 3000);
        return;
    }
    
    // Check credentials
    if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
        console.log('Login successful!'); // Debug log
        // Set authentication token with expiration
        const authData = {
            authenticated: true,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        };
        
        localStorage.setItem('sageAuth', 'true');
        localStorage.setItem('sageAuthData', JSON.stringify(authData));
        
        // Redirect to dashboard
        try {
            window.location.href = '/dashboard/home.html';
        } catch (error) {
            // Fallback redirect
            window.location.href = 'dashboard/home.html';
        }
    } else {
        console.log('Login failed!'); // Debug log
        // Show error message
        errorDiv.textContent = 'Invalid credentials. Use username: "asp" and password: "ese"';
        errorDiv.className = 'error-visible';
        setTimeout(() => {
            errorDiv.className = 'error-hidden';
        }, 3000);
    }
}

function logout() {
    localStorage.removeItem('sageAuth');
    localStorage.removeItem('sageAuthData');
    // Use absolute path for logout
    window.location.href = '/index.html';
}

function checkAuth() {
    const authData = localStorage.getItem('sageAuthData');
    
    if (!authData) {
        redirectToLogin();
        return;
    }
    
    try {
        const auth = JSON.parse(authData);
        const now = new Date();
        const expiresAt = new Date(auth.expiresAt);
        
        if (!auth.authenticated || now > expiresAt) {
            // Session expired or invalid
            localStorage.removeItem('sageAuth');
            localStorage.removeItem('sageAuthData');
            redirectToLogin();
            return;
        }
        
        // Refresh session if it's close to expiring (within 7 days)
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (expiresAt < sevenDaysFromNow) {
            auth.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            localStorage.setItem('sageAuthData', JSON.stringify(auth));
        }
        
    } catch (e) {
        console.error('Auth check failed:', e);
        redirectToLogin();
    }
}

function redirectToLogin() {
    // Use absolute path and only redirect if not authenticated
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/index.html';
    }
}

// Check auth status periodically
setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
