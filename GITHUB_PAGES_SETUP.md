# GitHub Pages Dashboard Setup

## Quick Start for Demo Users

The dashboard is now live at: **https://hpettitt.github.io/WebCallTest/dashboard/**

### To make it functional:

1. **Get your Airtable Personal Access Token:**
   - Go to https://airtable.com/developers/web/api/introduction
   - Click "Create token" 
   - Give it a name like "Dashboard Access"
   - Select the required scopes: `data.records:read`, `data.records:write`
   - Select your base (should be "Bloom Buddies Candidates")
   - Click "Create token" and copy it

2. **Configure the dashboard:**
   - Open the dashboard in your browser
   - Open browser developer tools (F12)
   - In the console, type:
   ```javascript
   CONFIG.airtable.personalAccessToken = 'your_token_here';
   ```
   - Replace `your_token_here` with your actual token
   - The dashboard will now connect to your Airtable

3. **For local development:**
   - Clone this repository
   - Create `dashboard/config-local.js` with your credentials
   - Open `dashboard/index.html` in your browser

### Features Available:
- ✅ Complete candidate management interface
- ✅ Real-time status filtering and updates  
- ✅ Accept/Reject actions (requires n8n webhook setup)
- ✅ Professional email automation (with n8n)
- ✅ Performance optimized with caching
- ✅ Responsive mobile-friendly design

### Security Notes:
- Tokens are only stored in browser memory (not saved)
- No sensitive data is committed to the repository
- Local config files are automatically gitignored

For detailed setup instructions, see `dashboard/README.md`