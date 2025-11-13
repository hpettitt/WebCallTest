// Dashboard Configuration
const CONFIG = {
    // Airtable Configuration - will be loaded from server endpoint
    airtable: {
        baseId: 'appni7Lgyrk5sjLXY', // Your actual base ID (just the app part)
        tableName: 'Candidates', // Your table name
        personalAccessToken: '', // Will be loaded from /api/dashboard-config
        baseUrl: 'https://api.airtable.com/v0'
    },

    // n8n Webhook URLs for actions 
    webhooks: {
        accept: 'https://kraig-unjustified-collinearly.ngrok-free.dev/webhook/bloom-buddies-status', // Set to your n8n webhook URL
        reject: 'https://kraig-unjustified-collinearly.ngrok-free.dev/webhook/bloom-buddies-status', // Set to your n8n webhook URL  
        refresh: '' // Optional - for refresh notifications
    },

    // Authentication settings - will be loaded from server endpoint
    auth: {
        validCredentials: {}, // Will be loaded from /api/dashboard-config
        sessionTimeout: 3600000 // 1 hour in milliseconds
    },

    // UI Configuration
    ui: {
        refreshInterval: 300000, // Auto-refresh every 5 minutes (reduced from 30 seconds)
        animationDelay: 100, // Stagger card animations
        maxCandidatesPerPage: 50
    },

    // Field mappings from Airtable
    fields: {
        candidateName: 'Candidate Name',
        email: 'Email',
        status: 'status',
        overallScore: 'score',
        communication: 'Communication',
        enthusiasm: 'enthusiasm',
        professionalism: 'professionalism',
        interviewDate: 'Interview Time',
        interviewLength: 'Interview Length',
        recommendation: 'Recommandation',
        summary: 'Interview Summary',
        analysis: 'Interview Analysis',
        transcript: 'Interview Transcript',
        availability: 'availability',
        nextAction: 'Next Action Recommendation'
    }
};

/**
 * Load configuration from server endpoint
 * This fetches secure credentials from environment variables
 */
async function loadConfigFromServer() {
    try {
        console.log('📡 Fetching dashboard config from server...');
        const response = await fetch('/api/dashboard-config');
        
        if (response.ok) {
            const serverConfig = await response.json();
            
            // Merge server config with local config
            if (serverConfig.airtable) {
                Object.assign(CONFIG.airtable, serverConfig.airtable);
                console.log('✅ Airtable config loaded:', {
                    baseId: CONFIG.airtable.baseId,
                    tableName: CONFIG.airtable.tableName,
                    hasToken: !!CONFIG.airtable.personalAccessToken,
                    tokenLength: CONFIG.airtable.personalAccessToken?.length || 0
                });
            }
            
            // Merge auth credentials from server
            if (serverConfig.auth && serverConfig.auth.validCredentials) {
                CONFIG.auth.validCredentials = serverConfig.auth.validCredentials;
                CONFIG.auth.sessionTimeout = serverConfig.auth.sessionTimeout || 3600000;
                console.log('✅ Auth credentials loaded:', {
                    userCount: Object.keys(CONFIG.auth.validCredentials).length,
                    users: Object.keys(CONFIG.auth.validCredentials)
                });
            }
        } else {
            console.warn('⚠️ Could not load server config, using local config');
        }
    } catch (error) {
        console.warn('⚠️ Error loading server config:', error.message);
        console.log('Using local config instead');
    }
}

// Debug: Log that main config is loaded
console.log('✅ Main config loaded:', {
    baseId: CONFIG.airtable.baseId,
    tableName: CONFIG.airtable.tableName,
    hasToken: !!CONFIG.airtable.personalAccessToken,
    tokenLength: CONFIG.airtable.personalAccessToken?.length || 0
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}