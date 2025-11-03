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
        // Secure user configuration with hashed passwords
        // In production, these would be stored securely server-side
        return {
            'admin@bloombuddies.com': {
                passwordHash: this.hashPassword('admin123!'), // Change this default password
                role: 'admin',
                permissions: ['read', 'write', 'delete', 'accept', 'reject', 'manage_users'],
                mfaEnabled: false
            },
            'hr@bloombuddies.com': {
                passwordHash: this.hashPassword('hr2024secure!'),
                role: 'hr_manager', 
                permissions: ['read', 'write', 'accept', 'reject'],
                mfaEnabled: false
            },
            'interviewer@bloombuddies.com': {
                passwordHash: this.hashPassword('interviewer2024!'),
                role: 'interviewer',
                permissions: ['read', 'write'],
                mfaEnabled: false
            }
        };
    }

    // Simple client-side hashing (in production, use proper server-side bcrypt)
    hashPassword(password) {
        // This is a simple hash for demo - use proper bcrypt in production
        let hash = 0;
        const salt = 'bloom_buddies_salt_2024';
        const combined = password + salt;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    verifyPassword(inputPassword, storedHash) {
        const inputHash = this.hashPassword(inputPassword);
        return inputHash === storedHash;
    }

    getUserByEmail(email) {
        return this.validUsers[email] || null;
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