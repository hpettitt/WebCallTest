// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'bloomBuddiesSession';
        this.init();
    }

    init() {
        // Check for existing session
        const savedSession = this.getSession();
        if (savedSession && this.isSessionValid(savedSession)) {
            this.currentUser = savedSession.user;
            this.hideLogin();
            this.showDashboard();
        } else {
            this.showLogin();
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authCode = document.getElementById('authCode').value;

        try {
            // Validate credentials
            if (this.validateCredentials(email, password)) {
                // For demo - in production, validate 2FA if provided
                if (authCode && !this.validate2FA(authCode)) {
                    this.showError('Invalid 2FA code');
                    return;
                }

                // Create session
                const user = {
                    email: email,
                    name: email.split('@')[0],
                    loginTime: new Date().toISOString(),
                    permissions: this.getUserPermissions(email)
                };

                this.currentUser = user;
                this.saveSession(user);
                
                this.hideLogin();
                this.showDashboard();
                
                // Initialize dashboard
                if (window.dashboard) {
                    window.dashboard.init();
                }

                this.showSuccess('Login successful!');
            } else {
                this.showError('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.clearSession();
        this.showLogin();
        this.hideDashboard();
        this.showSuccess('Logged out successfully');
    }

    validateCredentials(email, password) {
        const validCredentials = CONFIG.auth.validCredentials;
        return validCredentials[email] === password;
    }

    validate2FA(code) {
        // Simple demo validation - in production, integrate with proper 2FA service
        return code.length === 6 && /^\d+$/.test(code);
    }

    getUserPermissions(email) {
        // Define user permissions based on email
        if (email.includes('admin')) {
            return ['read', 'write', 'delete', 'accept', 'reject'];
        } else if (email.includes('hr')) {
            return ['read', 'write', 'accept', 'reject'];
        } else {
            return ['read'];
        }
    }

    saveSession(user) {
        const session = {
            user: user,
            timestamp: Date.now(),
            expires: Date.now() + CONFIG.auth.sessionTimeout
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    getSession() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error reading session:', error);
            return null;
        }
    }

    isSessionValid(session) {
        return session && session.expires > Date.now();
    }

    clearSession() {
        localStorage.removeItem(this.sessionKey);
    }

    showLogin() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
    }

    hideLogin() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
        }
    }

    showDashboard() {
        const dashboard = document.querySelector('.dashboard');
        const navbar = document.querySelector('.navbar');
        if (dashboard) dashboard.style.display = 'block';
        if (navbar) navbar.style.display = 'block';
    }

    hideDashboard() {
        const dashboard = document.querySelector('.dashboard');
        const navbar = document.querySelector('.navbar');
        if (dashboard) dashboard.style.display = 'none';
        if (navbar) navbar.style.display = 'none';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '3000',
            animation: 'slideIn 0.3s ease',
            maxWidth: '300px'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Check if user has specific permission
    hasPermission(permission) {
        return this.currentUser && 
               this.currentUser.permissions && 
               this.currentUser.permissions.includes(permission);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Auth manager will be initialized by main script

// Add CSS for notifications
const notificationStyles = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);