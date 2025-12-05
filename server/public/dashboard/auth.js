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
        // Check for existing valid session and JWT token
        const savedSession = this.getSession();
        const token = this.getToken();
        
        if (savedSession && this.isSessionValid(savedSession) && token) {
            // Verify the token is still valid by checking if user has an ID
            if (savedSession.user && savedSession.user.id) {
                this.currentUser = savedSession.user;
                this.hideLogin();
                this.showDashboard();
            } else {
                // Old session format without JWT - clear it
                console.log('⚠️ Old session detected, clearing...');
                this.clearSession();
                this.showLogin();
            }
        } else {
            this.clearSession(); // Clear invalid session
            this.hideDashboard(); // Ensure dashboard is hidden
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

            // Authenticate against server
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('📦 Login response:', { success: data.success, hasToken: !!data.token, hasUser: !!data.user });

            if (!data.success) {
                console.error('❌ Login failed on server side:', data.error);
                SECURE_CONFIG.recordLoginAttempt(email, false);
                this.showError(data.error || 'Invalid email or password');
                // Ensure dashboard stays hidden on failed login
                this.hideDashboard();
                this.showLogin();
                return;
            }

            // Verify we have required data
            if (!data.token) {
                console.error('❌ No token in response');
                this.showError('Authentication error: No token received');
                return;
            }

            if (!data.user || !data.user.id) {
                console.error('❌ Invalid user data in response:', data.user);
                this.showError('Authentication error: Invalid user data');
                return;
            }

            console.log('✅ Login response valid, user:', data.user.email);

            // Check if 2FA is required (optional for now)
            if (authCode && !this.validate2FA(authCode)) {
                SECURE_CONFIG.recordLoginAttempt(email, false);
                this.showError('Invalid 2FA code. Please try again.');
                return;
            }

            // Successful login
            SECURE_CONFIG.recordLoginAttempt(email, true);
            
            // Store JWT token
            console.log('💾 Storing JWT token');
            localStorage.setItem('authToken', data.token);
            
            // Create secure session
            const sessionUser = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role,
                permissions: this.getPermissionsForRole(data.user.role),
                loginTime: new Date().toISOString(),
                secureToken: SECURE_CONFIG.generateSecureToken({ email: data.user.email, role: data.user.role })
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

    getPermissionsForRole(role) {
        // Map role to permissions
        const rolePermissions = {
            'admin': ['read', 'write', 'delete', 'accept', 'reject', 'manage_users'],
            'hr_manager': ['read', 'write', 'accept', 'reject'],
            'interviewer': ['read', 'write'],
            'user': ['read']
        };
        return rolePermissions[role] || ['read'];
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

    getToken() {
        return localStorage.getItem('authToken');
    }

    clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.refreshTokenKey);
        // Clear any other auth-related items
        this.currentUser = null;
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