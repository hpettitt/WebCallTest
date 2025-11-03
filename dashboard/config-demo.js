// Demo Configuration Helper - For GitHub Pages demonstration
// This file provides easy setup instructions and helper functions

const DEMO_HELPER = {
    setupInstructions: `
🎯 DEMO SETUP INSTRUCTIONS:

1. Login with: admin@bloombuddies.com / admin123!
2. Open browser console (F12)
3. Run: DEMO_HELPER.configureAirtable('your_token_here')
4. Refresh the page to see your data

For quick demo, replace 'your_token_here' with your actual Airtable token.
    `,
    
    configureAirtable: function(token) {
        if (typeof CONFIG !== 'undefined') {
            CONFIG.airtable.personalAccessToken = token;
            console.log('✅ Airtable token configured for demo!');
            console.log('🔄 Please refresh the page to load your candidate data.');
            return true;
        } else {
            console.error('❌ CONFIG not available. Please ensure the page is fully loaded.');
            return false;
        }
    },
    
    showSetupHelp: function() {
        console.log(this.setupInstructions);
    }
};

// Auto-show instructions for GitHub Pages
if (window.location.hostname.includes('github.io')) {
    console.log('🎯 Demo Helper loaded for GitHub Pages');
    console.log('📖 Type DEMO_HELPER.showSetupHelp() for instructions');
    
    // Add visual helper to the setup instructions
    setTimeout(() => {
        const setupDiv = document.querySelector('.setup-instructions');
        if (setupDiv) {
            setupDiv.innerHTML += `
                <div style="margin-top: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 8px;">
                    <h4>🚀 Quick Demo Setup:</h4>
                    <ol>
                        <li>Open browser console (F12)</li>
                        <li>Run: <code style="background: #fff; padding: 2px 4px;">DEMO_HELPER.configureAirtable('your_token')</code></li>
                        <li>Refresh to see your data</li>
                    </ol>
                </div>
            `;
        }
    }, 1000);
}