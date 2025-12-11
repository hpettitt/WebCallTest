# Bloom Buddies Interview Automation System - Complete Setup Guide

## Overview
This system automates candidate interviews for Bloom Buddies childcare organization using token validation, VAPI phone interviews, Airtable integration, and Resend email notifications.

## System Architecture
```
Candidate Email → Scheduling → Interview → Resend Email
                      ↓
                  Airtable DB
                      ↓
                    VAPI Call
                      ↓
                  OpenAI (Voice)
                      ↓
                  Dashboard Review
```

---

## Part 1: Core Setup & Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Git** (for version control)
   - Download: https://git-scm.com/

### Required External Services (In Order of Priority)

| Service | Purpose | Cost | Signup Time |
|---------|---------|------|------------|
| **Airtable** | Database for candidates | Free tier available | 5 min |
| **Vapi** | Phone interview voice | Free tier available | 10 min |
| **Railway** | Production hosting | $5/month | 5 min |
| **OpenAI** | Voice intelligence | ~$0.10/call | 10 min |
| **Resend** | Email delivery | $20/month or free tier | 5 min |

---

## Part 2: Airtable Setup

### Step 1: Create Airtable Account
1. Go to https://airtable.com
2. Sign up with company email
3. Create a new Workspace named "Bloom Buddies"

### Step 2: Create Base & Table
1. Click "Create Base"
2. Name it: `Bloom Buddies Interview System`
3. Create a new table called `Candidates`

### Step 3: Configure Table Fields

Delete the default fields and create these exact fields in this order:

| # | Field Name | Field Type | Notes |
|---|-----------|-----------|-------|
| 1 | Candidate Name | Single line text | Full name |
| 2 | Email | Email | Candidate email |
| 3 | Phone | Phone number | Contact number |
| 4 | Interview Time | Date with time | UTC format (stored internally) |
| 5 | token | Single line text | Auto-generated unique token |
| 6 | Management Token | Single line text | For reschedule/cancel link |
| 7 | status | Single select | Options: pending, scheduled, accept, reject, cancelled |
| 8 | timezoneOffset | Number | Minutes (e.g., -60 for CET) |
| 9 | CV Content | Long text | Candidate's CV/resume |
| 10 | emailSent | Checkbox | Confirmation email sent |
| 11 | emailSentAt | Date with time | When confirmation was sent |
| 12 | emailMessageId | Single line text | Resend message ID |
| 13 | action | Single select | Options: pending, interviewed, reviewed |
| 14 | interviewCompleted | Checkbox | Interview finished |

### Step 4: Create Personal Access Token
1. Go to Account Settings → Developer Hub
2. Click "Create new token"
3. Name: `Bloom Buddies System`
4. Grant these scopes:
   - `data.records:read`
   - `data.records:write`
   - `data.records:delete`
   - `schema.bases:read`
5. Select your base
6. Create and **copy the token immediately** (won't be shown again)

### Step 5: Get Base ID
1. Open your base
2. Copy the URL: `https://airtable.com/`**`appXXXXXXXXXXXXXX`**`/viewXXX...`
3. The `appXXXXXXXXXXXXXX` part is your Base ID

**Example Values for .env:**
```
AIRTABLE_API_KEY=pat1234567890abcdefghijklmnopqrst
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Candidates
```

---

## Part 3: VAPI Setup (Voice AI)

### Step 1: Create VAPI Account
1. Go to https://vapi.ai
2. Sign up with email
3. Verify email
4. Accept terms

### Step 2: Configure Your Assistant
1. Click "Assistants" → "Create Assistant"
2. **Basic Settings:**
   - Name: `Bloom Buddies Interview Assistant`
   - System Prompt:
   ```
   You are a friendly interviewer for Bloom Buddies, a childcare organization.
   Your role is to:
   1. Welcome the candidate warmly
   2. Ask 3-4 key questions about their childcare experience
   3. Listen actively and take mental notes
   4. Thank them for their time
   5. Explain next steps
   
   Keep the call to 10-15 minutes.
   ```

3. **Voice Settings:**
   - Provider: OpenAI (requires OpenAI API key - see Part 4)
   - Voice Model: `gpt-4-turbo`
   - Voice Name: `nova` (recommended for professional tone)

4. **Call Settings:**
   - Enable recording: ✅ Yes
   - Max duration: 30 minutes
   - Background noise: Enabled

5. **Save Assistant**
   - Copy the **Assistant ID** (looks like: `778ec8a9-8f3e-4a38-9606-46752d4f830b`)

### Step 3: Generate VAPI API Key
1. Click Account → API Keys
2. Click "Create API Key"
3. Name: `Bloom Buddies System`
4. Copy the key **immediately**

**Example Values for .env:**
```
VAPI_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
VAPI_ASSISTANT_ID=778ec8a9-8f3e-4a38-9606-46752d4f830b
```

---

## Part 4: OpenAI Setup (Voice Intelligence)

### Step 1: Create OpenAI Account
1. Go to https://platform.openai.com
2. Sign up
3. Verify email
4. Add payment method (required for API usage)

### Step 2: Create API Key
1. Go to Account → API Keys
2. Click "Create new secret key"
3. Name: `Bloom Buddies`
4. Copy key **immediately** (shown only once)

### Step 3: Set Usage Limits (Optional but Recommended)
1. Go to Billing → Usage limits
2. Set monthly budget: $50 (or your limit)
3. This prevents runaway costs

### Step 4: Enable Required Models
1. Go to Models
2. Ensure these are available:
   - `gpt-4-turbo` (for VAPI voice)
   - `gpt-3.5-turbo` (for transcription)

**Example Values for .env:**
```
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrst
```

**Pricing (Approximate):**
- Voice calls: ~$0.10-0.30 per call
- Transcription: ~$0.01 per minute
- For 100 candidates/month: ~$20-40

---

## Part 5: Resend Email Setup

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up
3. Verify email

### Step 2: Add Your Domain
1. Click Domains
2. Add your domain: `ai.xenergies.com` (or your company domain)
3. Add DNS records (Resend will provide):
   ```
   CNAME: resend._domainkey.ai.xenergies.com → resend.example.com
   MX: 10 bounce.resend.com
   ```
4. Wait for DNS propagation (5-30 min)
5. Verify domain

### Step 3: Create API Key
1. Click API Keys
2. Click "Create API Key"
3. Name: `Bloom Buddies System`
4. Copy key **immediately**

### Step 4: Configure Email Settings
1. Verified Email From: `noreply@ai.xenergies.com`
2. Reply-To Email: `info@xenergies.com`
3. Email Contact: `support@xenergies.com` (displayed in footer)

**Example Values for .env:**
```
RESEND_API_KEY=re_1234567890abcdefghijklmnop
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@ai.xenergies.com
EMAIL_FROM_NAME=Bloom Buddies Interviews
EMAIL_REPLY_TO=info@xenergies.com
```

**Important:** 
- Resend free tier: 100 emails/day
- Paid: $20/month for unlimited
- Use free tier for testing, upgrade for production

---

## Part 6: Application Configuration

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd server
npm install
```

### Step 2: Create .env File
Create `server/.env` with all credentials from Parts 1-5:

```env
# ============ SERVER CONFIG ============
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
BASE_URL=https://candidates-bloombuddies.up.railway.app

# ============ AIRTABLE CONFIG ============
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_NAME=Candidates

# ============ VAPI CONFIG ============
VAPI_API_KEY=a1b2c3...
VAPI_ASSISTANT_ID=778ec8a9...

# ============ OPENAI CONFIG ============
OPENAI_API_KEY=sk-proj-...

# ============ RESEND EMAIL CONFIG ============
RESEND_API_KEY=re_...
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@ai.xenergies.com
EMAIL_FROM_NAME=Bloom Buddies Interviews
EMAIL_REPLY_TO=info@xenergies.com
SUPPORT_EMAIL=support@xenergies.com

# ============ COMPANY CONFIG ============
COMPANY_NAME=Bloom Buddies
COMPANY_EMAIL=info@xenergies.com
COMPANY_PHONE=+1-234-567-8900
SUPPORT_PHONE=+1-234-567-8900

# ============ ADMIN CONFIG ============
ADMIN_EMAIL=admin@xenergies.com
ADMIN_PASSWORD=changeme123!

# ============ BRANDING CONFIG ============
BRAND_COLOR_PRIMARY=#667eea
BRAND_COLOR_SECONDARY=#764ba2
BRAND_COLOR_SUCCESS=#48bb78
BRAND_COLOR_DANGER=#e53e3e
LOGO_URL=https://your-domain.com/logo.png

# ============ TIMEZONE CONFIG ============
DEFAULT_TIMEZONE=Europe/Berlin
DEFAULT_TIMEZONE_OFFSET=-60

# ============ AUTHENTICATION ============
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# ============ DATABASE BACKUPS ============
BACKUP_ENABLED=true
BACKUP_FREQUENCY=daily
BACKUP_EMAIL=admin@xenergies.com
```

### Step 3: Test Environment Variables
```bash
npm run test:env
```

---

## Part 7: Railway Deployment

### Step 1: Prepare for Deployment
1. Ensure `.env` is in `.gitignore` (it is)
2. Push code to GitHub: `git push origin main`

### Step 2: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub account
3. Authorize Railway to access your GitHub

### Step 3: Create Railway Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your `WebCallTest` repository
4. Click "Deploy Now"

### Step 4: Add Environment Variables
1. In Railway dashboard, click "Variables"
2. Add all variables from `.env` file
3. **CRITICAL:** Each environment variable MUST be set individually
4. Click "Save"

**Variables to add (minimum):**
- AIRTABLE_API_KEY
- AIRTABLE_BASE_ID
- VAPI_API_KEY
- VAPI_ASSISTANT_ID
- OPENAI_API_KEY
- RESEND_API_KEY
- EMAIL_FROM
- JWT_SECRET

### Step 5: Configure Domain
1. Click "Settings" → "Networking"
2. Copy the Railway Public URL (e.g., `https://bloombuddies-xyz.up.railway.app`)
3. Add custom domain: `candidates-bloombuddies.up.railway.app`
4. Update DNS CNAME records
5. Wait for SSL certificate (auto-generated)

### Step 6: Deploy
1. Railway auto-deploys on git push to main
2. Check Deployments tab for status
3. View logs: click "View Logs" button
4. Verify health: visit `/api/health`

---

## Part 8: Company Branding & Customization

### Color Scheme (Update .env)
```env
BRAND_COLOR_PRIMARY=#667eea      # Primary purple
BRAND_COLOR_SECONDARY=#764ba2    # Secondary purple
BRAND_COLOR_SUCCESS=#48bb78      # Success green
BRAND_COLOR_DANGER=#e53e3e       # Error red
BRAND_COLOR_WARNING=#f6ad55      # Warning orange
BRAND_COLOR_INFO=#4299e1         # Info blue
```

Update in `dashboard/styles.css`:
```css
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-success: #48bb78;
  --color-danger: #e53e3e;
}
```

### Email Customization

**Sender Information:**
```env
EMAIL_FROM_NAME=Bloom Buddies Interviews
COMPANY_PHONE=+1-234-567-8900
COMPANY_EMAIL=info@xenergies.com
SUPPORT_EMAIL=support@xenergies.com
```

**Email Templates** (in `server/services/email.js`):
- Confirmation: 17:55 in local time
- Reschedule: Converted back from UTC
- Acceptance: Company branding
- Rejection: Encouragement section

### Admin Email Configuration

**Primary Admin:** `admin@xenergies.com`
- Receives critical alerts
- Dashboard access
- User management

**Support Email:** `support@xenergies.com`
- Displayed in emails
- Candidate support requests

**Backup Contact:** `backup@xenergies.com`
- Optional secondary admin

---

## Part 9: Testing All Components

### Test 1: Airtable Connection
```bash
curl -H "Authorization: Bearer YOUR_PAT" \
  https://api.airtable.com/v0/YOUR_BASE_ID/Candidates
```

### Test 2: VAPI Connection
```bash
curl -H "Authorization: Bearer YOUR_VAPI_KEY" \
  https://api.vapi.ai/assistants/YOUR_ASSISTANT_ID
```

### Test 3: OpenAI Connection
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"
```

### Test 4: Resend Email
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@ai.xenergies.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Test 5: Full Interview Flow
1. Create test candidate in Airtable
2. Schedule interview time
3. Receive confirmation email
4. Visit interview link
5. Complete interview
6. Check dashboard

---

## Part 10: Timezone Handling

### Important: JavaScript getTimezoneOffset()
- Returns **negative** for UTC+ zones
- Example: CET (UTC+1) returns -60

### Formula
```
UTC time stored = local time + (timezone offset in minutes)
Local time displayed = UTC time - (timezone offset in minutes)

Example for CET (-60):
- User selects: 17:55 local
- Store in Airtable: 17:55 + (-60 min) = 16:55 UTC
- Display in email: 16:55 UTC - (-60 min) = 17:55 local
```

### Configuration
```env
DEFAULT_TIMEZONE=Europe/Berlin
DEFAULT_TIMEZONE_OFFSET=-60
```

### Candidate Timezone Offset
- Captured during registration: `req.body.timezoneOffset`
- Stored in Airtable `timezoneOffset` field
- Used for all display calculations

---

## Part 11: Maintenance & Monitoring

### Weekly Tasks
- [ ] Check Railway logs for errors
- [ ] Monitor email delivery rate
- [ ] Verify VAPI call quality
- [ ] Review Airtable for data accuracy

### Monthly Tasks
- [ ] Review API usage & costs
- [ ] Check Resend delivery metrics
- [ ] Update candidate list
- [ ] Test disaster recovery

### Quarterly Tasks
- [ ] Rotate API keys
- [ ] Update dependencies
- [ ] Review security
- [ ] Backup Airtable data

### Monitoring Dashboards
- **Railway:** https://railway.app/project/YOUR_PROJECT
- **Airtable:** https://airtable.com (base stats)
- **VAPI:** https://vapi.ai (call logs)
- **OpenAI:** https://platform.openai.com (usage)
- **Resend:** https://resend.com (email analytics)

---

## Part 12: Troubleshooting

### Email not sending
- ✓ Check RESEND_API_KEY in Railway
- ✓ Verify domain DNS records
- ✓ Check email in Resend dashboard
- ✓ Review server logs: `railway logs`

### Interview times off by 1 hour
- ✓ Verify timezone offset in Airtable
- ✓ Check DEFAULT_TIMEZONE_OFFSET
- ✓ Confirm candidate's system timezone

### VAPI calls not recording
- ✓ Verify OpenAI API key active
- ✓ Check VAPI assistant settings
- ✓ Ensure call recording enabled

### Dashboard not loading
- ✓ Check JWT_SECRET is set
- ✓ Verify admin credentials
- ✓ Clear browser cache
- ✓ Check browser console

---

## Part 13: Security Checklist

- [ ] All sensitive keys in `.env`
- [ ] `.env` NOT committed to git
- [ ] HTTPS enforced (Railway auto)
- [ ] JWT_SECRET changed from default
- [ ] Database backups enabled
- [ ] Admin password strong & unique
- [ ] IP whitelisting configured (if needed)
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] API keys rotated quarterly

---

## Summary of Costs (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Airtable | Free | Free tier sufficient |
| VAPI | $0-100 | Based on call volume |
| OpenAI | $20-50 | Based on call quality |
| Railway | $5-20 | Auto-scales |
| Resend | Free-$20 | 100 free emails/day |
| Domain | $10 | Already owned |
| **Total** | **$35-200** | Depends on volume |

---

## Version Control Commands

```bash
# Clone repository
git clone <repo-url>
cd server

# Install dependencies
npm install

# Start development server
node index.js

# Deploy to production
git push origin main  # Auto-deploys to Railway
```

---

## Contact & Support

**System Administrator:** admin@xenergies.com  
**Support Email:** support@xenergies.com  
**Documentation:** See README.md  
**Logs:** Railway dashboard → View Logs

---

**Last Updated:** December 11, 2025  
**Version:** 2.0 - Complete Setup  
**Status:** Production Ready


