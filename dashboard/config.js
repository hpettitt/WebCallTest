// Dashboard Configuration
const CONFIG = {
    // Airtable Configuration
    airtable: {
        baseId: 'appni7Lgyrk5sjLXY', // Your actual base ID (just the app part)
        tableName: 'Candidates', // Your table name
        personalAccessToken: '', // Will be prompted for or loaded from local config
        baseUrl: 'https://api.airtable.com/v0'
    },

    // n8n Webhook URLs for actions 
    webhooks: {
        accept: 'https://kraig-unjustified-collinearly.ngrok-free.dev/webhook/bloom-buddies-status', // Set to your n8n webhook URL
        reject: 'https://kraig-unjustified-collinearly.ngrok-free.dev/webhook/bloom-buddies-status', // Set to your n8n webhook URL  
        refresh: '' // Optional - for refresh notifications
    },

    // Authentication settings
    auth: {
        // For demo purposes - in production, use proper auth service
        validCredentials: {
            'admin@bloombuddies.com': 'secure123',
            'hr@bloombuddies.com': 'hr2023!'
        },
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}