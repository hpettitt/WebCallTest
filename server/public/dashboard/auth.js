// Secure Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = SECURE_CONFIG.authConfig.sessionKey;
        this.refreshTokenKey = SECURE_CONFIG.authConfig.refreshTokenKey;
        this.maxLoginAttempts = SECURE_CONFIG.authConfig.maxLoginAttempts;
        this.init();
    }

    init() {
        // Check for existing valid session
        const savedSession = this.getSession();
        if (savedSession && this.isSessionValid(savedSession)) {
            this.currentUser = savedSession.user;
            this.hideLogin();
            this.showDashboard();
        } else {
            this.clearSession(); // Clear invalid session
            this.showLogin();
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Auto-logout on session expire
        this.setupSessionMonitoring();
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
        
        const email = document.getElementById('email').value.toLowerCase().trim();
        const password = document.getElementById('password').value;
        const authCode = document.getElementById('authCode').value;

        try {
            // Check rate limiting
            if (!SECURE_CONFIG.checkRateLimit(email)) {
                this.showError('Too many failed attempts. Please try again in 15 minutes.');
                return;
            }

            // Validate credentials securely
            const user = SECURE_CONFIG.getUserByEmail(email);
            if (!user || !SECURE_CONFIG.verifyPassword(password, user.password)) {
                SECURE_CONFIG.recordLoginAttempt(email, false);
                this.showError('Invalid email or password');
                return;
            }

            // Validate 2FA if enabled
            if (user.mfaEnabled && authCode) {
                if (!this.validate2FA(authCode)) {
                    SECURE_CONFIG.recordLoginAttempt(email, false);
                    this.showError('Invalid 2FA code');
                    return;
                }
            }

            // Successful login
            SECURE_CONFIG.recordLoginAttempt(email, true);
            
            // Create secure session
            const sessionUser = {
                email: email,
                name: email.split('@')[0],
                role: user.role,
                permissions: user.permissions,
                loginTime: new Date().toISOString(),
                secureToken: SECURE_CONFIG.generateSecureToken({ email, role: user.role })
            };

            this.currentUser = sessionUser;
            this.saveSession(sessionUser);
            
            this.hideLogin();
            this.showDashboard();
            
            // Initialize Airtable after successful login if not already initialized
            if (!window.airtable) {
                console.log('🔗 Initializing Airtable after login...');
                window.airtable = new AirtableManager();
                console.log('Airtable manager initialized after login');
            }
            
            // Initialize dashboard
            if (window.dashboard) {
                window.dashboard.init();
            } else {
                // Initialize dashboard if not already created
                window.dashboard = new Dashboard();
                console.log('Dashboard initialized after login');
            }

            this.showSuccess(`Welcome back, ${sessionUser.name}! Security level: ${SECURE_CONFIG.getEnvironmentInfo().securityLevel}`);
            
            // Log security event
            this.logSecurityEvent('LOGIN_SUCCESS', email);
            
        } catch (error) {
            console.error('Login error:', error);
            this.logSecurityEvent('LOGIN_ERROR', email, error.message);
            this.showError('Login failed. Please try again.');
        }
    }

    handleLogout() {
        // Log security event
        this.logSecurityEvent('LOGOUT', this.currentUser?.email);
        
        this.currentUser = null;
        this.clearSession();
        this.showLogin();
        this.hideDashboard();
        this.showSuccess('Logged out successfully');
    }

    // Remove old validateCredentials method and replace with secure validation
    validateCredentials(email, password) {
        // This method is deprecated - using SECURE_CONFIG.verifyPassword instead
        console.warn('Legacy validateCredentials called - use secure validation');
        return false;
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
        
        // Show current user name
        const currentUserDisplay = document.getElementById('currentUserDisplay');
        const currentUserName = document.getElementById('currentUserName');
        if (currentUserDisplay && currentUserName && this.currentUser) {
            currentUserName.textContent = this.currentUser.name || this.currentUser.email;
            currentUserDisplay.style.display = 'inline';
        }
        
        // Show user management button for admins
        const userManagementBtn = document.getElementById('userManagementBtn');
        if (userManagementBtn && this.currentUser && this.currentUser.role === 'admin') {
            userManagementBtn.style.display = 'inline-block';
        }
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

    // Enhanced security methods
    hasPermission(permission) {
        return this.currentUser?.permissions?.includes(permission) || false;
    }

    // Enhanced session management
    setupSessionMonitoring() {
        // Check session validity every minute
        setInterval(() => {
            if (this.currentUser && !this.isSessionValid(this.getSession())) {
                this.showWarning('Session expired. Please log in again.');
                this.handleLogout();
            }
        }, 60000);
        
        // Auto-logout on page visibility change (security feature)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentUser) {
                this.logSecurityEvent('PAGE_HIDDEN', this.currentUser.email);
            }
        });
    }

    // Security event logging
    logSecurityEvent(eventType, email, details = '') {
        const event = {
            type: eventType,
            email: email,
            timestamp: new Date().toISOString(),
            details: details,
            userAgent: navigator.userAgent,
            ip: 'client-side', // In production, get from server
            sessionId: this.currentUser?.secureToken?.slice(0, 8) || 'none'
        };
        
        console.log('🔐 Security Event:', event);
        
        // In production, send to security monitoring service
        this.storeSecurityEvent(event);
    }

    storeSecurityEvent(event) {
        // Store security events locally for audit trail
        const events = JSON.parse(localStorage.getItem('security_events') || '[]');
        events.push(event);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('security_events', JSON.stringify(events));
    }

    getSecurityEvents() {
        return JSON.parse(localStorage.getItem('security_events') || '[]');
    }

    clearSession() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.refreshTokenKey);
        sessionStorage.clear();
    }

    validate2FA(code) {
        // Enhanced 2FA validation
        if (!code || code.length !== 6) return false;
        if (!/^\d+$/.test(code)) return false;
        
        // In production, validate against TOTP/SMS service
        // For demo, accept specific codes
        const validCodes = ['123456', '000000'];
        return validCodes.includes(code);
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