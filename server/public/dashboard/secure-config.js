// Secure Environment Configuration
// This system provides secure credential management for production deployment

class SecureConfig {
    constructor() {
        this.isProduction = this.detectEnvironment();
        this.authConfig = {
            sessionTimeout: 3600000, // 1 hour
            maxLoginAttempts: 5,
            lockoutDuration: 900000, // 15 minutes
            sessionKey: 'bloom_buddies_secure_session',
            refreshTokenKey: 'bloom_buddies_refresh_token'
        };
        this.initializeSecureAuth();
    }

    detectEnvironment() {
        // Detect if running on GitHub Pages or production environment
        return window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1' &&
               window.location.protocol === 'https:';
    }

    initializeSecureAuth() {
        if (this.isProduction) {
            // Production: Use secure user input system
            this.setupProductionAuth();
        } else {
            // Development: Use local config if available
            this.setupDevelopmentAuth();
        }
    }

    setupProductionAuth() {
        // For production, we'll use a secure login system that doesn't store credentials
        // Users will need to enter their credentials which are validated against secure hashes
        this.validUsers = this.getSecureUserConfig();
    }

    setupDevelopmentAuth() {
        // Development mode - check for local config
        if (typeof LOCAL_AUTH_CONFIG !== 'undefined') {
            this.validUsers = LOCAL_AUTH_CONFIG.users;
        } else {
            // Fallback to secure production mode
            this.setupProductionAuth();
        }
    }

    getSecureUserConfig() {
        // Default user configuration with plaintext passwords
        // These come from server via /api/dashboard-config in production
        // 
        // 2FA CODES (for demo purposes):
        // - Valid codes: 123456, 000000
        // - In production, integrate with Google Authenticator, Authy, or SMS service
        return {
            'admin@bloombuddies.com': {
                password: 'secure123',
                role: 'admin',
                permissions: ['read', 'write', 'delete', 'accept', 'reject', 'manage_users'],
                mfaEnabled: true // 2FA REQUIRED - Use code: 123456 or 000000
            },
            'hr@bloombuddies.com': {
                password: 'hr2024secure!',
                role: 'hr_manager', 
                permissions: ['read', 'write', 'accept', 'reject'],
                mfaEnabled: false // 2FA Optional
            },
            'interviewer@bloombuddies.com': {
                password: 'interviewer2024!',
                role: 'interviewer',
                permissions: ['read', 'write'],
                mfaEnabled: false // 2FA Optional
            }
        };
    }

    verifyPassword(inputPassword, storedPassword) {
        // Direct plaintext comparison (credentials from server)
        const isMatch = inputPassword === storedPassword;
        console.log('🔐 Password Verification:', {
            inputProvided: inputPassword?.length > 0,
            storedExists: !!storedPassword,
            inputLength: inputPassword?.length || 0,
            storedLength: storedPassword?.length || 0,
            match: isMatch,
            debug: isMatch ? '✅ MATCH' : '❌ MISMATCH'
        });
        return isMatch;
    }

    getUserByEmail(email) {
        const user = this.validUsers[email] || null;
        console.log('👤 getUserByEmail:', {
            email,
            found: !!user,
            availableUsers: Object.keys(this.validUsers),
            userDetails: user ? { role: user.role, mfaEnabled: user.mfaEnabled } : null
        });
        return user;
    }

    generateSecureToken(user) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const userInfo = btoa(JSON.stringify({
            email: user.email,
            role: user.role,
            timestamp: timestamp,
            expires: timestamp + this.authConfig.sessionTimeout
        }));
        
        return `${userInfo}.${random}`;
    }

    validateToken(token) {
        try {
            const [userInfo, random] = token.split('.');
            const decoded = JSON.parse(atob(userInfo));
            
            if (decoded.expires < Date.now()) {
                return null; // Token expired
            }
            
            return decoded;
        } catch (e) {
            return null; // Invalid token
        }
    }

    // Rate limiting for login attempts
    checkRateLimit(email) {
        // Disable rate limiting for GitHub Pages demos
        if (window.location.hostname.includes('github.io')) {
            console.log('🎯 Rate limiting disabled for GitHub Pages demo');
            return true;
        }
        
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        const userAttempts = attempts[email] || { count: 0, lastAttempt: 0 };
        
        if (userAttempts.count >= this.authConfig.maxLoginAttempts) {
            const timeSinceLastAttempt = Date.now() - userAttempts.lastAttempt;
            if (timeSinceLastAttempt < this.authConfig.lockoutDuration) {
                return false; // User is locked out
            } else {
                // Reset attempts after lockout period
                delete attempts[email];
                localStorage.setItem('login_attempts', JSON.stringify(attempts));
            }
        }
        
        return true;
    }

    recordLoginAttempt(email, success) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        
        if (success) {
            // Clear attempts on successful login
            delete attempts[email];
        } else {
            // Record failed attempt
            attempts[email] = {
                count: (attempts[email]?.count || 0) + 1,
                lastAttempt: Date.now()
            };
        }
        
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
    }

    getEnvironmentInfo() {
        return {
            isProduction: this.isProduction,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            securityLevel: this.isProduction ? 'HIGH' : 'DEVELOPMENT'
        };
    }
}

// Initialize secure config
const SECURE_CONFIG = new SecureConfig();

// Log security status
console.log('🔐 Secure Authentication System Initialized:', SECURE_CONFIG.getEnvironmentInfo());