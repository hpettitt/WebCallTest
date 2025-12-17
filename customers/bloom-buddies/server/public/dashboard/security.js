// Security Headers and CSRF Protection Manager
class SecurityManager {
    constructor() {
        this.csrfToken = this.generateCSRFToken();
        this.securityHeaders = this.getRecommendedHeaders();
        this.initializeSecurity();
    }

    initializeSecurity() {
        // Add security meta tags if not present
        this.addSecurityMetaTags();
        
        // Initialize CSRF protection
        this.initializeCSRFProtection();
        
        // Set up security monitoring
        this.setupSecurityMonitoring();
        
        // Add security warnings for development
        this.addSecurityWarnings();
        
        console.log('🛡️ Security Manager initialized with CSRF protection');
    }

    addSecurityMetaTags() {
        const securityTags = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
            { httpEquiv: 'Content-Security-Policy', content: this.getCSPHeader() }
        ];

        securityTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"], meta[http-equiv="${tag.httpEquiv}"]`)) {
                const meta = document.createElement('meta');
                if (tag.name) meta.name = tag.name;
                if (tag.httpEquiv) meta.httpEquiv = tag.httpEquiv;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });
    }

    getCSPHeader() {
        // Content Security Policy for dashboard
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://cdnjs.cloudflare.com",
            "connect-src 'self' https://api.airtable.com https://*.ngrok-free.dev",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "object-src 'none'"
        ].join('; ');
    }

    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    getCSRFToken() {
        return this.csrfToken;
    }

    validateCSRFToken(token) {
        return token === this.csrfToken;
    }

    initializeCSRFProtection() {
        // Add CSRF token to all forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            let csrfInput = form.querySelector('input[name="csrf_token"]');
            if (!csrfInput) {
                csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = this.csrfToken;
                form.appendChild(csrfInput);
            }
        });

        // Intercept all AJAX requests to add CSRF token
        this.interceptAjaxRequests();
    }

    interceptAjaxRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            // Add CSRF token only to same-origin requests (not external APIs like Airtable)
            if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
                // Check if URL is same-origin (relative or same domain)
                const isExternalAPI = url.includes('api.airtable.com') || url.includes('stripe.com') || new URL(url, window.location.origin).origin !== window.location.origin;
                
                if (!isExternalAPI) {
                    options.headers = {
                        ...options.headers,
                        'X-CSRF-Token': this.csrfToken
                    };
                }
            }
            
            return originalFetch(url, options);
        };
    }

    setupSecurityMonitoring() {
        // Monitor for suspicious activity
        let clickCount = 0;
        let lastClickTime = 0;
        
        document.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - lastClickTime < 100) {
                clickCount++;
                if (clickCount > 10) {
                    this.logSecurityEvent('SUSPICIOUS_RAPID_CLICKS', {
                        count: clickCount,
                        timeWindow: now - lastClickTime
                    });
                }
            } else {
                clickCount = 0;
            }
            lastClickTime = now;
        });

        // Monitor for console tampering
        let devToolsOpen = false;
        setInterval(() => {
            const threshold = 160;
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devToolsOpen) {
                    devToolsOpen = true;
                    this.logSecurityEvent('DEV_TOOLS_OPENED');
                }
            } else {
                devToolsOpen = false;
            }
        }, 1000);
    }

    logSecurityEvent(eventType, details = {}) {
        const event = {
            type: 'SECURITY_' + eventType,
            timestamp: new Date().toISOString(),
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.warn('🚨 Security Event:', event);
        
        // Store in security log
        const securityLog = JSON.parse(localStorage.getItem('security_log') || '[]');
        securityLog.push(event);
        
        // Keep only last 50 security events
        if (securityLog.length > 50) {
            securityLog.splice(0, securityLog.length - 50);
        }
        
        localStorage.setItem('security_log', JSON.stringify(securityLog));
    }

    addSecurityWarnings() {
        if (SECURE_CONFIG.getEnvironmentInfo().isProduction) {
            // Production warnings
            if (window.location.protocol !== 'https:') {
                console.warn('⚠️ SECURITY WARNING: Not using HTTPS in production!');
            }
        } else {
            // Development warnings
            console.warn('🔧 DEVELOPMENT MODE: Enhanced security features disabled');
            console.warn('🔧 Remember to test in production environment');
        }
    }

    // Input sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    // Rate limiting helper
    isRateLimited(key, maxRequests = 5, timeWindow = 60000) {
        const requests = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
        const now = Date.now();
        
        // Remove old requests outside time window
        const recentRequests = requests.filter(time => now - time < timeWindow);
        
        if (recentRequests.length >= maxRequests) {
            return true; // Rate limited
        }
        
        // Add current request
        recentRequests.push(now);
        localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentRequests));
        
        return false; // Not rate limited
    }

    getSecurityReport() {
        return {
            environment: SECURE_CONFIG.getEnvironmentInfo(),
            csrfProtection: !!this.csrfToken,
            securityHeaders: this.securityHeaders,
            securityEvents: JSON.parse(localStorage.getItem('security_log') || '[]'),
            lastSecurityCheck: new Date().toISOString()
        };
    }

    getRecommendedHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': this.getCSPHeader(),
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        };
    }
}

// Initialize security manager
const SECURITY_MANAGER = new SecurityManager();

// Export for global access
window.SECURITY_MANAGER = SECURITY_MANAGER;