# Interview Dashboard Setup Guide

## 🌸 Bloom Buddies Interview Dashboard

A modern, responsive dashboard for managing candidate interviews with Airtable integration and automated email workflows.

## Features

- **Secure Authentication** - Login with 2FA support
- **Real-time Data** - Live sync with Airtable
- **Candidate Management** - View, filter, and manage candidates
- **Interview Details** - Complete interview information and analysis
- **One-click Actions** - Accept/reject candidates with automated emails
- **Mobile Responsive** - Works on all devices

## Quick Setup

### 1. Configure Airtable Connection

Edit `dashboard/config.js` and update these values:

```javascript
airtable: {
    baseId: 'YOUR_AIRTABLE_BASE_ID',                    // Found in your Airtable URL
    tableName: 'Interview Records',                      // Your table name
    personalAccessToken: 'YOUR_AIRTABLE_PERSONAL_ACCESS_TOKEN', // From Airtable Developer Hub
    baseUrl: 'https://api.airtable.com/v0'
}
```

**How to get your Airtable credentials:**

**Personal Access Token (PAT):**
1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Give it a name like "Interview Dashboard"
4. Add these scopes:
   - `data.records:read` - Read records
   - `data.records:write` - Update records
   - `schema.bases:read` - Read base schema
5. Add your base to "Access" section
6. Click "Create token" and copy the token (starts with `pat...`)

**Base ID:**
1. Go to https://airtable.com/api (legacy method) OR
2. In your base URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The `appXXXXXXXXXXXXXX` part is your Base ID

### 2. Set Up Authentication

Update the valid login credentials in `config.js`:

```javascript
auth: {
    validCredentials: {
        'admin@bloombuddies.com': 'secure123',
        'hr@bloombuddies.com': 'hr2023!'
    }
}
```

### 3. Configure n8n Webhooks

Update webhook URLs in `config.js`:

```javascript
webhooks: {
    accept: 'https://your-n8n-instance.com/webhook/accept-candidate',
    reject: 'https://your-n8n-instance.com/webhook/reject-candidate'
}
```

### 4. Field Mapping

Ensure field names in `config.js` match your Airtable columns:

```javascript
fields: {
    candidateName: 'Candidate Name',
    email: 'Email',
    status: 'status',
    overallScore: 'score',
    // ... etc
}
```

## Testing Locally

1. **Open the dashboard:**
   ```bash
   # Navigate to dashboard folder
   cd dashboard
   
   # Open in browser (or use Live Server in VS Code)
   start index.html
   ```

2. **Login with test credentials:**
   - Email: `admin@bloombuddies.com`
   - Password: `secure123`
   - 2FA Code: Any 6-digit number (for demo)

3. **Test the connection:**
   - Dashboard should load candidate data from Airtable
   - Check browser console for any errors

## Deployment Options

### Option 1: GitHub Pages (Free)
1. Push dashboard files to your repository
2. Go to repository Settings → Pages
3. Select source branch
4. Access via: `https://yourusername.github.io/WebCallTest/dashboard/`

### Option 2: Netlify (Free)
1. Create account at netlify.com
2. Drag dashboard folder to Netlify deploy area
3. Get custom URL

### Option 3: Vercel (Free)
1. Create account at vercel.com
2. Connect GitHub repository
3. Deploy with automatic builds

## n8n Integration

Create these n8n workflows for email automation:

### Accept Candidate Workflow
1. **Webhook Trigger** - Listen for accept actions
2. **Airtable Update** - Update candidate status
3. **Gmail Send** - Send acceptance email
4. **Response** - Confirm action

### Reject Candidate Workflow
1. **Webhook Trigger** - Listen for reject actions
2. **Airtable Update** - Update candidate status
3. **Gmail Send** - Send rejection email
4. **Response** - Confirm action

## Security Considerations

### For Production:
- Replace demo authentication with proper OAuth (Auth0, Firebase)
- Use environment variables for API keys
- Enable HTTPS
- Implement proper session management
- Add rate limiting
- Use CORS properly

### Current Security Features:
- Session timeout (1 hour)
- Role-based permissions
- API key protection
- XSS protection (HTML escaping)

## Troubleshooting

### Common Issues:

**"Airtable is not configured"**
- Check API credentials in config.js
- Verify base ID and table name

**"Failed to load candidates"**
- Check browser console for errors
- Verify Airtable API key permissions
- Check CORS settings if deployed

**"Login failed"**
- Check credentials in config.js
- Clear browser localStorage
- Check browser console

### Browser Console Commands:

```javascript
// Test Airtable connection
airtable.testConnection().then(console.log);

// Check current user
auth.getCurrentUser();

// Clear cache and reload
airtable.clearCache();
dashboard.refreshData();
```

## File Structure

```
dashboard/
├── index.html          # Main dashboard page
├── styles.css          # All styling
├── config.js           # Configuration settings
├── auth.js             # Authentication module
├── airtable.js         # Airtable API integration
└── dashboard.js        # Main dashboard logic
```

## Features in Detail

### Dashboard Overview
- Candidate statistics
- Status filtering
- Search functionality
- Real-time updates

### Candidate Cards
- Score visualization
- Quick actions
- Status indicators
- Responsive design

### Interview Details
- Complete candidate information
- Score breakdown
- Interview transcript
- Recommendation analysis

### Actions
- Accept/reject with confirmation
- Automated email sending
- Status updates
- Activity logging

## Future Enhancements

- [ ] Advanced filtering and sorting
- [ ] Export to PDF/Excel
- [ ] Interview scheduling
- [ ] Bulk actions
- [ ] Analytics dashboard
- [ ] Email templates customization
- [ ] Mobile app
- [ ] Real-time notifications

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Airtable and n8n configurations
3. Test with demo credentials first
4. Check network requests in developer tools

---

**Built for Bloom Buddies** 🌸  
Modern interview management made simple.