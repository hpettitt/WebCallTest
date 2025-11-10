# Bloom Buddies Interview Automation System - Setup Guide

## Overview
This system automates candidate interviews for Bloom Buddies childcare organization using token validation, VAPI phone interviews, and Airtable integration.

## System Components
- **Token Validation Page** - Validates candidate tokens and appointment times
- **Interview Page** - VAPI-powered phone interview
- **Dashboard** - Review and manage candidate interviews
- **Backend Server** - Express.js API with Airtable integration

---

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Git** (for version control)
   - Download from: https://git-scm.com/

### Required Services & Credentials
1. **Airtable Account**
   - Personal Access Token (PAT)
   - Base ID
   - Table Name: "Candidates"

2. **VAPI Account**
   - API Key
   - Assistant ID

3. **n8n Instance** (optional - for webhooks)
   - Webhook URL for call completion

---

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd server
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web server
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `airtable` - Airtable API client
- `axios` - HTTP client

### 3. Configure Environment Variables

Create a `.env` file in the server root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Airtable Configuration
AIRTABLE_API_KEY=your_personal_access_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=Candidates

# VAPI Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_ASSISTANT_ID=your_vapi_assistant_id_here

# n8n Webhook Configuration (optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/vapi-call-completed

# Email Configuration (future use)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# JWT Configuration (future use)
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h
```

### 4. Set Up Airtable

#### Create Personal Access Token
1. Go to Airtable Account Settings
2. Navigate to "Developer Hub" > "Personal Access Tokens"
3. Click "Create new token"
4. Name it "Bloom Buddies Interview System"
5. Grant scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
6. Add access to your base
7. Copy the token and add to `.env`

#### Configure Airtable Base
Your "Candidates" table must have these fields:

| Field Name | Field Type | Description |
|------------|-----------|-------------|
| Token | Single line text | Unique token for each candidate |
| Candidate Name | Single line text | Full name of candidate |
| Email | Email | Candidate's email address |
| Interview Time | Date with time | Scheduled appointment time |
| Status | Single select | pending/accepted/rejected |
| InterviewCompleted | Checkbox | Whether interview is done |
| Interview Weekday | Formula/Text | Day of the week |
| Days from Interview | Number | Days until/since interview |

**Important Field Names:**
- The system expects `Interview Time` (not `AppointmentTime`)
- The system expects `Candidate Name` (not just `Name`)

### 5. Set Up VAPI

1. Log in to your VAPI account
2. Create or select an assistant
3. Copy the Assistant ID
4. Generate an API key from Account Settings
5. Add both to `.env` file

### 6. Configure Interview Page Webhook

The interview page sends data to an n8n webhook for processing. Update the webhook URL in:
- `public/interview.html` (line ~250)

Current configuration:
```javascript
serverUrl: "https://your-n8n-instance.com/webhook/vapi-call-completed"
```

---

## Running the Server

### Development Mode
```bash
node index.js
```

The server will start on `http://localhost:3000`

### Using a Process Manager (Recommended for Production)
```bash
npm install -g pm2
pm2 start index.js --name "bloom-buddies-server"
pm2 save
pm2 startup
```

---

## Testing the System

### 1. Test Token Validation
1. Create a test candidate in Airtable with:
   - Token: `test123`
   - Candidate Name: `Test User`
   - Email: `test@example.com`
   - Interview Time: (current time ± 30 minutes)
   - Status: `pending`
   - InterviewCompleted: unchecked

2. Visit: `http://localhost:3000/?token=test123`
3. You should see the welcome page with candidate details

### 2. Test Interview Flow
1. Click "Start Interview" on validation page
2. Should redirect to `/interview.html?session=test123&name=Test%20User`
3. Click "Start Phone Interview"
4. VAPI phone widget should appear
5. Click to start the call

### 3. Test Dashboard
1. Visit: `http://localhost:3000/dashboard/`
2. Log in with credentials (configured in dashboard)
3. View candidate list
4. Filter by status
5. Review interview details

---

## API Endpoints

### POST `/api/validate-token`
Validates a candidate token and checks appointment time window.

**Request:**
```json
{
  "token": "candidate-token-here"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "Access granted - proceed to interview",
  "candidate": {
    "id": "recXXXXXXXXXXXXXX",
    "name": "John Doe",
    "email": "john@example.com",
    "appointmentTime": "2025-11-10T19:55:00.000Z"
  },
  "timeInfo": {
    "valid": true,
    "message": "Interview window is active",
    "minutesIntoWindow": 10
  }
}
```

**Response (Invalid Token):**
```json
{
  "valid": false,
  "error": "Invalid token - candidate not found"
}
```

**Response (Too Early):**
```json
{
  "valid": false,
  "error": "Interview window opens in 15 minutes",
  "timeInfo": {
    "valid": false,
    "tooEarly": true,
    "minutesUntil": 15
  }
}
```

### POST `/api/get-vapi-credentials`
Returns VAPI credentials for interview page (server-side security).

**Request:**
```json
{
  "sessionToken": "candidate-token",
  "candidateName": "John Doe"
}
```

**Response:**
```json
{
  "vapiKey": "f3a732ca-378e-40ca-88e2-7a39d326a8e0",
  "vapiAssistantId": "778ec8a9-8f3e-4a38-9606-46752d4f830b",
  "success": true
}
```

### GET `/api/candidates?status=pending`
Retrieves candidate list (for dashboard).

### PUT `/api/candidates/:id`
Updates candidate status (accept/reject from dashboard).

---

## Time Window Validation

The system validates appointment times with a flexible window:
- **5 minutes BEFORE** appointment time
- **30 minutes AFTER** appointment time

Example:
- Appointment: 2:00 PM
- Window opens: 1:55 PM
- Window closes: 2:30 PM

---

## File Structure

```
server/
├── .env                          # Environment variables (DO NOT COMMIT)
├── .gitignore                    # Git ignore rules
├── index.js                      # Main server file
├── package.json                  # Dependencies
├── SETUP_GUIDE.md               # This file
├── services/
│   └── airtable.js              # Airtable service module
└── public/
    ├── index.html               # Token validation page
    ├── interview.html           # VAPI interview page
    └── dashboard/               # Interview dashboard
        ├── index.html
        ├── styles.css
        ├── config.js
        ├── config-local.js
        ├── dashboard.js
        ├── airtable.js
        ├── auth.js
        └── security.js
```

---

## Deployment to Production

### Option 1: Railway (Recommended)
1. Create account at https://railway.app/
2. Create new project
3. Connect GitHub repository
4. Add environment variables in Railway dashboard
5. Deploy automatically on git push

### Option 2: Render
1. Create account at https://render.com/
2. Create new Web Service
3. Connect GitHub repository
4. Add environment variables
5. Set build command: `npm install`
6. Set start command: `node index.js`

### Option 3: Heroku
1. Create account at https://heroku.com/
2. Install Heroku CLI
3. Run:
```bash
heroku create bloom-buddies-interviews
heroku config:set AIRTABLE_API_KEY=your_key_here
heroku config:set VAPI_API_KEY=your_key_here
# ... set all env vars
git push heroku main
```

### Post-Deployment Steps
1. Update Calendly links to use production URL
2. Update n8n webhook URLs
3. Test complete flow with real candidate
4. Monitor logs for errors

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` file to git
- ✅ Use different credentials for dev/prod
- ✅ Rotate API keys regularly
- ✅ Use HTTPS in production

### 2. API Security
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Use CORS properly
- ✅ Add authentication to dashboard

### 3. Data Protection
- ✅ Store sensitive data in environment variables
- ✅ Use Airtable's built-in security
- ✅ Implement proper error handling
- ✅ Log access attempts

---

## Troubleshooting

### Issue: "Token not found"
**Solution:** Check that:
1. Token exists in Airtable `Candidates` table
2. Field name is exactly "Token" (case-sensitive)
3. `.env` has correct `AIRTABLE_BASE_ID` and `AIRTABLE_TABLE_NAME`

### Issue: "Invalid time value"
**Solution:** Check that:
1. "Interview Time" field exists in Airtable
2. Field type is "Date with time"
3. Value is properly formatted (not empty)

### Issue: "VAPI not connecting"
**Solution:** Check that:
1. VAPI credentials are correct in `.env`
2. Browser allows microphone access
3. Not using embedded browser (use Chrome/Firefox/Edge)
4. Check browser console for errors

### Issue: "Dashboard not loading"
**Solution:** Check that:
1. All dashboard files are in `public/dashboard/`
2. `config-local.js` has correct Airtable token
3. Browser allows JavaScript execution
4. Check network tab for 404 errors

### Issue: "Field mapping errors"
**Solution:** The system expects these exact field names:
- `Interview Time` (not `AppointmentTime`)
- `Candidate Name` (not `Name`)
- Update field names in Airtable or modify mapping in `services/airtable.js` line 29-30

---

## Support & Maintenance

### Regular Maintenance Tasks
- [ ] Monitor server logs weekly
- [ ] Review candidate data monthly
- [ ] Update dependencies quarterly
- [ ] Rotate API keys annually
- [ ] Backup Airtable data regularly

### Monitoring
Check these regularly:
- Server uptime
- API response times
- VAPI call success rate
- Airtable storage usage
- Error logs

### Getting Help
1. Check server logs: `pm2 logs bloom-buddies-server`
2. Review browser console errors (F12)
3. Verify environment variables
4. Test with curl/Postman
5. Check VAPI dashboard for call logs

---

## System Flow Diagram

```
┌─────────────┐
│   Email     │
│  + Token    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Calendly Schedule  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│ Validation Page      │
│ ?token=XXX           │
│                      │
│ 1. Check Airtable   │
│ 2. Validate time    │
│ 3. Show candidate   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Interview Page       │
│                      │
│ 1. Get VAPI creds   │
│ 2. Start phone call │
│ 3. Send to webhook  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ n8n Webhook          │
│                      │
│ Process transcript   │
│ Update Airtable      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Dashboard            │
│                      │
│ Review & Accept/     │
│ Reject candidates    │
└──────────────────────┘
```

---

## Version History

### Version 1.0.0 (Current)
- ✅ Token validation with time windows
- ✅ VAPI phone interview integration
- ✅ Airtable data management
- ✅ Dashboard for candidate review
- ✅ Server-side credential security
- ✅ Bloom Buddies branding

### Planned Features
- 🔄 Email notifications
- 🔄 SMS reminders
- 🔄 Calendar integration
- 🔄 Advanced analytics
- 🔄 Multi-language support

---

## License & Credits

**Built for:** Bloom Buddies Childcare Organization  
**Date:** November 2025  
**Technology Stack:** Node.js, Express, Airtable, VAPI, n8n

---

## Contact

For technical support or questions:
- Review this guide first
- Check troubleshooting section
- Review server logs
- Contact system administrator

---

**End of Setup Guide**
