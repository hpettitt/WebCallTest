# Production Deployment Guide
**Bloom Buddies Interview Automation System**

This guide walks you through deploying the interview automation system to production, including setting up all required service accounts.

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:
- [ ] A GitHub account (for code hosting)
- [ ] A credit/debit card (for service sign-ups, most offer free tiers)
- [ ] Access to your domain's DNS settings (if using custom domain)
- [ ] 1-2 hours for complete setup

---

## 🏗️ Architecture Overview

The system requires these services:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Railway/Render     → Host Node.js server                 │
│ 2. Airtable          → Database for candidate records       │
│ 3. VAPI              → AI phone interview service           │
│ 4. n8n (optional)    → Workflow automation                  │
│ 5. Calendly          → Interview scheduling                 │
│ 6. Email Service     → Send invitation emails               │
└─────────────────────────────────────────────────────────────┘
```

**Estimated Monthly Costs:**
- Railway: $5-10/month (free tier available)
- Airtable: Free tier sufficient for <1000 records
- VAPI: Pay-per-call (~$0.05-0.15 per minute)
- n8n: Free self-hosted or $20/month cloud
- Calendly: Free tier available
- Email: Free (Gmail) or $10/month (SendGrid)

**Total: $0-50/month** depending on usage and tier selections

---

## Part 1: Service Account Setup

### 1.1 GitHub Account Setup

**Purpose:** Store and deploy your code

**Steps:**
1. Go to https://github.com/signup
2. Create account with your work email
3. Verify your email address
4. Enable 2FA (Settings → Password and authentication → Two-factor authentication)

**What you'll need:**
- GitHub repository URL (provided or forked)
- Personal Access Token (for deployments)

**Create Personal Access Token:**
```
1. Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "Production Deployment"
4. Expiration: 90 days
5. Select scopes:
   ✅ repo (all)
   ✅ workflow
6. Click "Generate token"
7. COPY TOKEN IMMEDIATELY (you won't see it again!)
8. Save in password manager
```

---

### 1.2 Railway Account Setup (Recommended)

**Purpose:** Host your Node.js server

**Why Railway?**
- ✅ Easiest setup (connects directly to GitHub)
- ✅ Free tier: $5 credit/month (sufficient for testing)
- ✅ Automatic deployments on git push
- ✅ Built-in environment variables
- ✅ Free SSL certificates

**Steps:**

1. **Sign Up**
   - Go to https://railway.app/
   - Click "Login" → "Login with GitHub"
   - Authorize Railway to access GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `WebCallTest`
   - Select the `server` folder if prompted

3. **Configure Build Settings**
   - Root Directory: `/server`
   - Build Command: `npm install`
   - Start Command: `node index.js`

4. **Add Domain**
   - Go to project Settings → Networking
   - Click "Generate Domain"
   - Copy the URL (e.g., `your-app.railway.app`)
   - OR add custom domain:
     - Click "Custom Domain"
     - Enter your domain (e.g., `interviews.bloombuddies.com`)
     - Copy the CNAME record
     - Add to your DNS provider (see DNS section below)

5. **Note Your URLs**
   ```
   Production URL: https://your-app.railway.app
   API Base URL: https://your-app.railway.app/api
   Dashboard URL: https://your-app.railway.app/dashboard
   ```

**Alternative: Render (If Railway doesn't work)**

1. Go to https://render.com/
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect repository
5. Settings:
   - Name: `bloom-buddies-interviews`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Instance Type: Free
6. Click "Create Web Service"

---

### 1.3 Airtable Account Setup

**Purpose:** Database for storing candidate information and interview results

**Steps:**

1. **Create Account**
   - Go to https://airtable.com/signup
   - Sign up with work email
   - Choose "Product Development" or "Other" for use case
   - Select Free plan

2. **Create Base**
   - Click "Add a base" → "Start from scratch"
   - Name: `Bloom Buddies Interviews`
   - Click the base to open

3. **Create Table Schema**
   - Rename default table to: `Candidates`
   - Add these fields (click + to add column):

   | Field Name | Field Type | Description |
   |------------|-----------|-------------|
   | Token | Single line text | Unique interview token |
   | Candidate Name | Single line text | Full name |
   | Email | Email | Contact email |
   | Phone | Phone number | Contact phone (optional) |
   | Interview Time | Date with time | Scheduled appointment |
   | Status | Single select | pending, accepted, rejected |
   | InterviewCompleted | Checkbox | Has interview been done |
   | Interview Weekday | Formula | `DATETIME_FORMAT({Interview Time}, 'dddd')` |
   | Days from Interview | Number | Days until/since interview |
   | CV Text | Long text | Resume/CV content |
   | Call Duration | Number | Minutes |
   | Call Recording URL | URL | Link to recording |
   | Call Transcript | Long text | Interview transcript |
   | Call Summary | Long text | AI-generated summary |
   | Interview Score | Number | 1-10 rating |
   | Notes | Long text | Additional notes |

4. **Get Credentials**

   **a) Get Base ID:**
   ```
   1. Go to https://airtable.com/api
   2. Click on your "Bloom Buddies Interviews" base
   3. The URL will look like: https://airtable.com/[BASE_ID]/api/docs
   4. Copy the BASE_ID (starts with "app")
   ```

   **b) Create Personal Access Token:**
   ```
   1. Go to https://airtable.com/create/tokens
   2. Click "Create new token"
   3. Name: "Bloom Buddies Production"
   4. Scopes:
      ✅ data.records:read
      ✅ data.records:write
      ✅ schema.bases:read
   5. Access:
      ✅ Select "Bloom Buddies Interviews" base
   6. Click "Create token"
   7. COPY TOKEN IMMEDIATELY
   8. Save in password manager
   ```

5. **Add Sample Test Record**
   ```
   Token: test123
   Candidate Name: Test Candidate
   Email: test@example.com
   Interview Time: [tomorrow at 2pm]
   Status: pending
   InterviewCompleted: unchecked
   ```

---

### 1.4 VAPI Account Setup

**Purpose:** AI-powered phone interview agent

**Steps:**

1. **Create Account**
   - Go to https://vapi.ai/
   - Click "Get Started" or "Sign Up"
   - Sign up with work email
   - Verify email

2. **Add Credits**
   - Go to Billing
   - Add $20-50 to start (pay-as-you-go)
   - Cost: ~$0.05-0.15 per minute of interview

3. **Create Assistant**
   - Go to "Assistants" → "New Assistant"
   - Name: `Bloom Buddies Interviewer`
   - Voice: Select preferred voice (try "Emma" or "Emily")
   - Transcriber: `Deepgram Nova 2`
   - Model: `GPT-4` or `GPT-3.5-turbo`
   
4. **Configure Assistant Prompt**
   ```
   You are a friendly HR interviewer for Bloom Buddies, a childcare organization.

   Your role:
   - Conduct a professional but warm interview
   - Ask about childcare experience
   - Assess candidate's suitability for working with children
   - Review their CV/resume which will be provided
   - Ask 5-7 relevant questions
   - Keep interview under 10 minutes
   - Be encouraging and supportive

   Interview Topics:
   1. Experience with children
   2. Understanding of child development
   3. Safety and emergency handling
   4. Communication with parents
   5. Teamwork and flexibility
   6. Career goals in childcare

   End the interview by thanking them and letting them know they'll hear back within 5 business days.
   ```

5. **Get Credentials**
   ```
   API Key:
   1. Go to Settings → API Keys
   2. Click "Create API Key"
   3. Copy the key
   4. Save in password manager

   Assistant ID:
   1. Go to Assistants
   2. Click on "Bloom Buddies Interviewer"
   3. Copy the ID from the URL or assistant details
   4. Format: starts with letters/numbers
   ```

---

### 1.5 n8n Setup (Optional but Recommended)

**Purpose:** Automate post-interview workflows (send transcripts to Airtable, notify team)

**Option A: Self-Hosted (Free)**

1. **Using Railway:**
   ```
   1. In Railway, click "New Project"
   2. Select "Deploy from template"
   3. Search for "n8n"
   4. Click "Deploy n8n"
   5. Wait for deployment
   6. Get your URL: https://your-n8n.railway.app
   ```

2. **Set Up Workflow:**
   ```
   1. Go to your n8n URL
   2. Create account (first user is admin)
   3. Create new workflow
   4. Add "Webhook" trigger node
   5. Copy webhook URL
   6. Add "Airtable" node to update records
   7. Activate workflow
   ```

**Option B: Cloud Hosted ($20/month)**

1. Go to https://n8n.io/pricing
2. Sign up for "Starter" plan
3. Create workspace
4. Follow workflow steps above

**Webhook URL Format:**
```
https://your-n8n.railway.app/webhook/vapi-call-completed
```

---

### 1.6 Calendly Account Setup

**Purpose:** Schedule candidate interviews

**Steps:**

1. **Create Account**
   - Go to https://calendly.com/signup
   - Sign up with work email
   - Choose "Scheduling for yourself"
   - Connect your calendar (Google/Outlook)

2. **Create Event Type**
   - Click "Create" → "Event Type"
   - Name: `Bloom Buddies Interview`
   - Duration: 30 minutes (buffer for 10-min AI call)
   - Location: Custom (you'll add interview link)
   - Description:
     ```
     Thank you for your interest in Bloom Buddies!
     
     You will receive an email with a unique interview link shortly before your scheduled time.
     
     The interview will be conducted by our AI interviewer and takes approximately 10 minutes.
     Please ensure you have:
     - A quiet environment
     - Good internet connection
     - Phone or computer with microphone access
     ```

3. **Configure Confirmation Email**
   - Go to Event Settings → Notifications and Cancellation Policy
   - Enable Email Confirmation
   - Customize email template (see below)

4. **Email Template with Token** (requires Calendly paid plan or use Zapier/n8n):
   ```
   Subject: Your Bloom Buddies Interview - Scheduled!

   Hi {Invitee Name},

   Your interview is confirmed for {Event Date} at {Event Time}.

   When it's time, click this link to begin:
   https://your-app.railway.app/?token={unique_token}

   The interview takes about 10 minutes. Please arrive on time.

   Questions? Reply to this email.

   Best regards,
   Bloom Buddies HR Team
   ```

   **Note:** Token generation requires integration (see Part 3)

---

### 1.7 Email Service Setup

**Purpose:** Send interview invitation emails with tokens

**Option A: Gmail (Free, Simple)**

1. Use your Gmail account
2. Enable 2FA: https://myaccount.google.com/security
3. Create App Password:
   ```
   1. Go to Google Account → Security → 2-Step Verification
   2. Scroll to "App passwords"
   3. Select app: Mail
   4. Select device: Other (Custom name) → "Bloom Buddies Server"
   5. Click Generate
   6. Copy 16-character password
   7. Save in password manager
   ```

**Option B: SendGrid (Professional, 100 emails/day free)**

1. Go to https://sendgrid.com/
2. Sign up for free account
3. Verify email and complete setup
4. Create API Key:
   ```
   1. Go to Settings → API Keys
   2. Click "Create API Key"
   3. Name: "Bloom Buddies Production"
   4. Permissions: Full Access
   5. Copy API key
   ```

5. Verify Sender Identity:
   ```
   1. Go to Settings → Sender Authentication
   2. Click "Verify a Single Sender"
   3. Enter your email details
   4. Check email and verify
   ```

---

## Part 2: Environment Configuration

### 2.1 Gather All Credentials

Create a secure document with these values (use password manager):

```env
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app

# Airtable Configuration
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Candidates

# VAPI Configuration
VAPI_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://your-n8n.railway.app/webhook/vapi-call-completed

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# OR Email Configuration (SendGrid)
# EMAIL_SERVICE=sendgrid
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASSWORD=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# JWT Configuration
JWT_SECRET=generate-random-string-here-use-password-generator-64-chars
JWT_EXPIRES_IN=24h
```

### 2.2 Generate JWT Secret

**Option 1: Online Generator**
```
Go to: https://passwordsgenerator.net/
Length: 64 characters
Include: Letters, numbers, symbols
Click Generate
Copy the result
```

**Option 2: Command Line**
```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

## Part 3: Railway Deployment

### 3.1 Add Environment Variables to Railway

1. **Open Your Railway Project**
   - Go to https://railway.app/dashboard
   - Click on your project

2. **Add Variables**
   - Click on "Variables" tab
   - Click "New Variable" for each variable
   - Paste the name and value from your `.env` list
   - Click "Add" after each

   **Quick Add All Variables:**
   ```
   Click "RAW Editor"
   Paste your entire .env content
   Click "Update Variables"
   ```

3. **Verify Variables**
   - Make sure all 16 variables are listed
   - Check for typos
   - Ensure no quotes around values

### 3.2 Deploy to Railway

**Automatic Deployment (Recommended):**

1. **Connect GitHub**
   - Railway already connected when you created project
   - Any push to `main` branch auto-deploys

2. **Trigger Deployment**
   ```powershell
   cd "J:\My Drive\AI\Clients\Patrick Aipoh\pages\WebCallTest\server"
   git checkout main
   git pull origin main
   git push origin main
   ```

3. **Monitor Deployment**
   - Go to Railway dashboard
   - Click "Deployments" tab
   - Watch build logs
   - Wait for "Success" status (2-3 minutes)

4. **Check Deployment**
   - Click "View Logs"
   - Look for: `Server is running on port 3000`
   - Look for: `injecting env (16) from .env`

**Manual Deployment (If needed):**

1. **Install Railway CLI**
   ```powershell
   npm install -g @railway/cli
   ```

2. **Login**
   ```powershell
   railway login
   ```

3. **Link Project**
   ```powershell
   cd "J:\My Drive\AI\Clients\Patrick Aipoh\pages\WebCallTest\server"
   railway link
   ```

4. **Deploy**
   ```powershell
   railway up
   ```

### 3.3 Verify Deployment

**Test Endpoints:**

1. **Health Check**
   ```
   Open browser: https://your-app.railway.app/
   Should see: Server welcome page or redirect
   ```

2. **API Test**
   ```powershell
   # PowerShell
   Invoke-RestMethod -Uri "https://your-app.railway.app/api/candidates" -Method GET
   ```

3. **Dashboard Test**
   ```
   Open browser: https://your-app.railway.app/dashboard/
   Should see: Login page
   Login with: admin@bloombuddies.com / secure123 / 123456
   ```

4. **Token Validation Test**
   ```
   Open browser: https://your-app.railway.app/?token=test123
   Should see: Welcome page with test candidate info
   ```

---

## Part 4: DNS and Custom Domain (Optional)

### 4.1 Add Custom Domain

**If using custom domain (e.g., interviews.bloombuddies.com):**

1. **In Railway:**
   - Go to Settings → Networking
   - Click "Custom Domain"
   - Enter: `interviews.bloombuddies.com`
   - Copy the CNAME target (e.g., `cname.railway.app`)

2. **In Your DNS Provider (GoDaddy, Cloudflare, Namecheap, etc.):**
   ```
   Type: CNAME
   Name: interviews
   Value: [paste CNAME from Railway]
   TTL: Automatic or 3600
   ```

3. **Wait for DNS Propagation** (5 minutes - 48 hours)
   - Check status: https://dnschecker.org/
   - Enter: interviews.bloombuddies.com

4. **SSL Certificate**
   - Railway automatically provisions SSL
   - Wait 5-10 minutes after DNS propagates
   - Your site will be available at: https://interviews.bloombuddies.com

---

## Part 5: Integration Testing

### 5.1 End-to-End Test

**Test the complete workflow:**

1. **Create Test Candidate in Airtable**
   ```
   Token: live-test-001
   Candidate Name: Your Name
   Email: your-email@example.com
   Interview Time: [current time]
   Status: pending
   InterviewCompleted: unchecked
   CV Text: "5 years childcare experience. Passionate about early childhood education."
   ```

2. **Test Token Validation**
   ```
   Open: https://your-app.railway.app/?token=live-test-001
   Expected: Welcome page with your details
   Click: "Start Interview"
   ```

3. **Test Interview Page**
   ```
   Expected: Interview page loads
   Click: "Start Phone Interview"
   Expected: VAPI widget appears
   Action: Make test call (costs ~$0.50-1.50)
   ```

4. **Test Dashboard**
   ```
   Open: https://your-app.railway.app/dashboard/
   Login: admin@bloombuddies.com / secure123 / 123456
   Expected: See your test candidate
   Action: Click "View Details"
   Action: Accept or Reject
   ```

5. **Verify Airtable Update**
   ```
   Go to Airtable
   Check test candidate record
   Status should be: accepted or rejected
   InterviewCompleted: should be checked
   ```

### 5.2 Test with Real Candidate (Staging)

1. **Schedule via Calendly**
   - Share your Calendly link
   - Book appointment as test candidate
   - Check confirmation email

2. **Generate Token** (Manual for now)
   - Add record to Airtable with unique token
   - Send email with link: `https://your-app.railway.app/?token=ABC123`

3. **Complete Interview**
   - Candidate clicks link at scheduled time
   - Completes VAPI interview
   - Check Airtable for results

---

## Part 6: Email Automation Integration

### 6.1 Option A: Using n8n (Recommended)

**Create Email Workflow:**

1. **Go to n8n**
   - Open your n8n instance
   - Create new workflow: "Send Interview Invitations"

2. **Add Nodes:**
   ```
   1. Airtable Trigger (when new record created)
      - Base: Bloom Buddies Interviews
      - Table: Candidates
      - Trigger on: Record Created

   2. Function Node (Generate Token)
      - Code:
        const token = Math.random().toString(36).substring(2, 15);
        return {json: {token: token}};

   3. Airtable Update Node
      - Update record with token
      - Field: Token

   4. Gmail/SendGrid Node
      - To: {{$node["Airtable Trigger"].json["Email"]}}
      - Subject: Your Bloom Buddies Interview Link
      - Body: (see template below)

   5. Calendly Node (if using paid plan)
      - Schedule event
   ```

3. **Email Template:**
   ```html
   Hi {{$node["Airtable Trigger"].json["Candidate Name"]}},

   Thank you for your interest in joining the Bloom Buddies team!

   Your interview is scheduled for {{$node["Airtable Trigger"].json["Interview Time"]}}.

   When it's time, click here to begin your interview:
   https://your-app.railway.app/?token={{$node["Function"].json["token"]}}

   The interview takes approximately 10 minutes. Please ensure you have:
   - A quiet environment
   - Good internet connection
   - Phone or computer with microphone

   We look forward to speaking with you!

   Best regards,
   Bloom Buddies HR Team
   ```

4. **Activate Workflow**

### 6.2 Option B: Using Zapier

1. Sign up at https://zapier.com/
2. Create Zap: "Airtable → Gmail/SendGrid"
3. Trigger: New record in Airtable
4. Action: Send email with template above

### 6.3 Option C: Manual Process (Temporary)

1. New candidate applies
2. Manually add to Airtable
3. Generate token (use: https://www.uuidgenerator.net/)
4. Send email manually with token link

---

## Part 7: Monitoring and Maintenance

### 7.1 Set Up Monitoring

**Railway Monitoring:**
```
1. Go to Railway project
2. Click "Metrics" tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request logs
```

**Set Up Alerts:**
```
1. Settings → Notifications
2. Enable email notifications for:
   - Deployment failures
   - High resource usage
   - Service downtime
```

### 7.2 Check Logs Regularly

**View Logs:**
```
Railway Dashboard → Deployments → View Logs
```

**What to look for:**
```
✅ Server starts successfully
✅ Environment variables loaded
✅ No Airtable connection errors
✅ No VAPI API errors
✅ Successful token validations
```

**Common Issues:**
```
❌ "AIRTABLE_API_KEY is not defined" → Check environment variables
❌ "NOT_FOUND" from Airtable → Check Base ID and Table Name
❌ "Invalid token" → Check Airtable field mapping
❌ "VAPI error" → Check VAPI credits and API key
```

### 7.3 Regular Maintenance Tasks

**Weekly:**
- [ ] Check candidate records in Airtable
- [ ] Review interview results
- [ ] Monitor VAPI usage and costs
- [ ] Check Railway resource usage

**Monthly:**
- [ ] Review Railway invoice
- [ ] Review VAPI invoice
- [ ] Update dependencies: `npm update`
- [ ] Check for security updates
- [ ] Review and accept/reject candidates

**Quarterly:**
- [ ] Rotate API keys
- [ ] Backup Airtable data
- [ ] Review system performance
- [ ] Update documentation

---

## Part 8: Scaling and Optimization

### 8.1 When to Scale

**Signs you need to scale:**
- More than 100 interviews/month
- Slow response times (>2 seconds)
- Railway resource usage >80%
- Frequent downtime

**Scaling Options:**

1. **Railway Pro Plan** ($20/month)
   - More resources
   - Better performance
   - Priority support

2. **Add Redis Caching**
   ```
   Railway → New Service → Redis
   Update code to cache Airtable queries
   ```

3. **Load Balancer** (for high traffic)
   ```
   Railway → Settings → Replicas
   Set to 2-3 instances
   ```

### 8.2 Cost Optimization

**Reduce VAPI Costs:**
- Use shorter interviews (7-8 minutes vs 10)
- Use GPT-3.5-turbo instead of GPT-4
- Implement interview screening first

**Reduce Railway Costs:**
- Use free tier until >100 candidates/month
- Optimize database queries
- Enable compression
- Use CDN for static files

---

## Part 9: Troubleshooting

### 9.1 Common Deployment Issues

**Issue: Build Fails**
```
Solution:
1. Check Railway logs
2. Verify package.json is correct
3. Ensure all dependencies are listed
4. Try: npm install locally first
```

**Issue: Server Starts but Crashes**
```
Solution:
1. Check environment variables (all 16 present?)
2. Verify Airtable credentials
3. Check VAPI credentials
4. View Railway logs for error message
```

**Issue: Can't Access Site**
```
Solution:
1. Check Railway deployment status (green?)
2. Verify domain/URL is correct
3. Check DNS settings (if custom domain)
4. Try incognito mode
5. Check Railway service status
```

**Issue: Token Validation Fails**
```
Solution:
1. Verify token exists in Airtable
2. Check Airtable Base ID is correct
3. Check Airtable Table Name is "Candidates"
4. Verify field names match exactly:
   - "Token" (not "token")
   - "Candidate Name" (not "Name")
   - "Interview Time" (not "AppointmentTime")
```

**Issue: VAPI Not Working**
```
Solution:
1. Check VAPI credits balance
2. Verify VAPI API key is correct
3. Verify Assistant ID is correct
4. Test in regular browser (not embedded)
5. Check browser allows microphone access
6. Check VAPI service status
```

### 9.2 Getting Help

**Railway Support:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app/

**Airtable Support:**
- Community: https://community.airtable.com/
- Docs: https://airtable.com/developers/web/api/introduction

**VAPI Support:**
- Discord: (check VAPI website)
- Docs: https://docs.vapi.ai/

**General Issues:**
- Check SETUP_GUIDE.md
- Check BRANCHING_STRATEGY.md
- Review server logs
- Test locally first

---

## Part 10: Post-Deployment Checklist

### 10.1 Final Verification

- [ ] Server deployed and running
- [ ] All environment variables set
- [ ] Airtable connection working
- [ ] VAPI integration working
- [ ] Dashboard accessible
- [ ] Token validation working
- [ ] Test interview completed successfully
- [ ] Email notifications working (if configured)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backup plan established

### 10.2 Update Calendly

- [ ] Update Calendly event description with production URL
- [ ] Configure email template with token link
- [ ] Test booking process

### 10.3 Update Documentation

- [ ] Document production URLs
- [ ] Save all credentials in password manager
- [ ] Create backup of `.env` configuration
- [ ] Document custom domain settings
- [ ] Create team access guide

### 10.4 Train Team

- [ ] Demo dashboard to HR team
- [ ] Show how to review candidates
- [ ] Explain accept/reject process
- [ ] Provide login credentials
- [ ] Create FAQ for common questions

---

## Part 11: Security Checklist

### 11.1 Secure Your Deployment

- [ ] All API keys stored in Railway environment variables (not in code)
- [ ] `.env` file in `.gitignore` (verify it's not in GitHub)
- [ ] 2FA enabled on GitHub account
- [ ] 2FA enabled on Railway account
- [ ] 2FA enabled on Airtable account
- [ ] Strong passwords on all service accounts
- [ ] API keys rotated regularly (every 90 days)
- [ ] Only necessary people have access to Railway/Airtable
- [ ] Dashboard 2FA enabled for admin accounts
- [ ] HTTPS enforced on all URLs

### 11.2 Backup Strategy

**Airtable Backup (Weekly):**
```
1. Open Airtable base
2. Click "..." menu → Download CSV
3. Save to secure location
4. Consider automated backups via API
```

**Code Backup:**
```
Already backed up in GitHub
Create additional branch: backup-[date]
```

**Environment Variables Backup:**
```
Save .env file to password manager
Never commit to GitHub
Keep offline encrypted copy
```

---

## Appendix A: Quick Reference

### Service URLs
```
Railway Dashboard: https://railway.app/dashboard
Airtable: https://airtable.com/
VAPI Dashboard: https://dashboard.vapi.ai/
n8n Dashboard: https://your-n8n.railway.app/
Calendly: https://calendly.com/
```

### Production URLs (Replace with yours)
```
Server: https://your-app.railway.app
Dashboard: https://your-app.railway.app/dashboard
Token Validation: https://your-app.railway.app/?token=TOKEN
Interview Page: https://your-app.railway.app/interview.html
```

### Support Contacts
```
Technical Issues: [your-tech-email]
Railway Issues: support@railway.app
Airtable Issues: support@airtable.com
VAPI Issues: [check VAPI website]
```

---

## Appendix B: Cost Breakdown

### Monthly Cost Estimate (100 candidates/month)

| Service | Free Tier | Paid Tier | Cost |
|---------|-----------|-----------|------|
| Railway | $5 credit | $20/month | $0-20 |
| Airtable | 1200 records | Unlimited | $0 |
| VAPI | Pay-per-use | N/A | $25-50 |
| n8n | Self-hosted | $20/month | $0-20 |
| Calendly | Free | $10/month | $0-10 |
| SendGrid | 100/day free | $15/month | $0-15 |
| **Total** | | | **$25-115/month** |

**Note:** Most costs are variable based on usage. Start with free tiers and upgrade as needed.

---

## Appendix C: Next Steps After Deployment

1. **Week 1:**
   - Monitor daily for errors
   - Process first real candidates
   - Gather feedback from HR team
   - Fine-tune VAPI prompts

2. **Week 2-4:**
   - Optimize interview questions
   - Improve email templates
   - Add more candidates
   - Review analytics

3. **Month 2+:**
   - Consider enhanced features (enhanced branch)
   - Implement advanced 2FA
   - Add reporting dashboard
   - Scale as needed

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Tested By:** [Your Name]  
**Test Date:** [Date]  
**Status:** ⏳ Awaiting customer testing and feedback

---

## Feedback Form

**After testing this guide, please provide feedback:**

**What worked well:**
- 

**What was confusing:**
- 

**What's missing:**
- 

**Errors encountered:**
- 

**Time to complete:**
- 

**Overall difficulty (1-10):**
- 

**Suggestions for improvement:**
- 

---

**Ready to deploy? Start with Part 1!**
