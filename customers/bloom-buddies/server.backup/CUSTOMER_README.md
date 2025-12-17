# Bloom Buddies - Interview Automation System

## Welcome! 👋

You now have a fully functional **AI-powered interview automation system** that handles candidate scheduling, interviews, and management through an intelligent voice AI assistant.

---

## What This System Does

✅ **Automated Candidate Scheduling** - Candidates book interviews via web form  
✅ **Voice AI Interviews** - VAPI conducts interviews with OpenAI's voice intelligence  
✅ **Interview Management** - Candidates can reschedule or cancel interviews  
✅ **Admin Dashboard** - Review candidates, transcripts, and make hiring decisions  
✅ **Email Notifications** - Automatic confirmations and updates via Resend  
✅ **Data Storage** - All data securely stored in Airtable  
✅ **Workflow Automation** - Optional n8n integration for advanced automation  

---

## Your Account Information

### Email Address (All Services)
```
contact@enqavon-incorporated.com
```

### Service Passwords/Keys
| Service | Email | Password/Key | Notes |
|---------|-------|--------------|-------|
| **Railway** | contact@enqavon-incorporated.com | OTP (no password) | https://railway.app |
| **VAPI** | contact@enqavon-incorporated.com | fp8-YLvN9s2J&P3 | https://vapi.ai |
| **Airtable** | contact@enqavon-incorporated.com | fp8-YLvN9s2J&P3  | https://airtable.com |
| **n8n** | contact@enqavon-incorporated.com | 6LiASiGJ@7X-pb | https://enqavon-workflows.up.railway.app |
| **OpenAI** | API Key | sk-proj-QCVR8rkMPS7RHnr_... | https://platform.openai.com |
| **Resend** | [Your account] | [Your API key] | https://resend.com |

---

## Live System URLs

### 🎙️ Candidate Interview Link
```
https://enqavon-interviews.up.railway.app/schedule-interview.html
```
Share this with candidates to schedule interviews

### 📊 Admin Dashboard
```
https://enqavon-interviews.up.railway.app/dashboard/
```
Login to review candidates, transcripts, and make decisions

### 🔄 Interview Management (Demo)
```
https://enqavon-interviews.up.railway.app/manage-interview-demo.html
```
Shows how candidates reschedule/cancel interviews

### ⚙️ Configuration Panel
```
https://enqavon-interviews.up.railway.app/config-panel.html
```
Customize system settings and email templates

### 📖 Setup Documentation
```
https://enqavon-interviews.up.railway.app/SETUP_GUIDE.md
```
Complete technical documentation (Part 1-15)

### 🔧 n8n Workflows (Optional)
```
https://enqavon-workflows.up.railway.app
```
Advanced automation and interview processing

---

## Quick Start (5 Minutes)

### 1️⃣ Test the Scheduling Page
1. Visit: https://enqavon-interviews.up.railway.app/schedule-interview.html
2. Fill in test candidate details
3. Select a future date/time
4. Click "Schedule Interview"

### 2️⃣ Check Your Email
- Look for confirmation email from `noreply@[YOUR-DOMAIN].com`
- Verify interview details and time zone

### 3️⃣ View in Airtable
1. Log into https://airtable.com
2. Open your "Bloom Buddies Interview System" base
3. Check "Candidates" table for new record

### 4️⃣ Access Admin Dashboard
1. Visit: https://enqavon-interviews.up.railway.app/dashboard/
2. Login with admin credentials (from setup)
3. View all scheduled candidates

### 5️⃣ Complete Interview (Optional)
1. Visit the interview link from confirmation email
2. Click "Start My Interview"
3. Speak naturally with AI interviewer
4. Interview should last 10-15 minutes
5. Check dashboard for completion status

---

## Key Features Explained

### 📅 Candidate Scheduling
- Candidates enter name, email, phone, CV
- Select timezone and interview time
- Automatic confirmation email sent
- Data stored in Airtable

**URL:** `/schedule-interview.html`

### 🎤 Voice Interview
- VAPI conducts interview automatically
- Questions customized to your company
- Call recorded and transcribed
- Runs 10-15 minutes
- Accessible from confirmation email link

**What candidate sees:**
1. Click "Start My Interview" button
2. Phone interview starts
3. Speak with friendly AI assistant
4. Interview automatically ends or candidate hangs up

### 📝 Manage Interview
- Candidates can reschedule to new date/time
- Reschedule or cancel option
- Timezone-aware display
- Secure token-based access (no login needed)

**URL:** `/manage-interview-demo.html` (shows how it works)

### 📊 Admin Dashboard
- View all candidates in table
- Filter by status (pending, scheduled, accept, reject, cancelled)
- See interview transcripts
- Accept/reject candidates
- Export data

**Features:**
- Real-time updates from Airtable
- Interview scores and transcript viewer
- Timezone display in your local time
- Secure login required

### 💬 Email Notifications
- Confirmation: When candidate schedules
- Reminder: Before interview (optional)
- Completion: When interview finishes
- Rejection: If not accepted
- All branded with your company colors

### 🔄 Workflow Automation (n8n)
- Automatically process transcripts
- Extract key information
- Send follow-up emails
- Update hiring status
- Trigger custom actions

**Access:** https://enqavon-workflows.up.railway.app

---

## Important Settings

### Timezone Configuration
- **Default System Timezone:** Europe/Berlin
- **Default Offset:** -60 minutes (UTC+1)

The system automatically captures each candidate's timezone and converts times correctly.

### Email Sender
- **From Email:** noreply@[YOUR-DOMAIN].com
- **Reply-To:** contact@enqavon-incorporated.com
- **Support Email:** contact@enqavon-incorporated.com

Update these in Railway Variables if needed.

### Interview Assistant Configuration
Your VAPI assistant is configured to:
1. Welcome candidate warmly
2. Ask 3-4 key questions about experience
3. Listen actively and take notes
4. Thank candidate and explain next steps
5. Keep call to 10-15 minutes

To modify questions or behavior:
1. Log into https://vapi.ai
2. Click "Assistants"
3. Select "Bloom Buddies Interview Assistant"
4. Edit "System Prompt"
5. Save changes

---

## Costs Explained

### Per Interview Costs (15 minutes average)

| Service | Cost | Breakdown |
|---------|------|-----------|
| **VAPI** | $1.65 | $0.11/minute × 15 min |
| **OpenAI** | $0.50 | Whisper ($0.30) + TTS ($0.05) + Processing ($0.15) |
| **Resend** | $0 | Free tier (100 emails/day) or $0.05 paid |
| **Railway** | $0.12 | Amortized ($12/month ÷ 100 interviews) |
| **Airtable** | $0 | Free tier sufficient |
| **TOTAL** | **$2.27-2.32** | Per 15-minute interview |

### Monthly Estimates (100 interviews)

| Service | Monthly | Notes |
|---------|---------|-------|
| VAPI | $165 | Largest cost (72%) |
| OpenAI | $50 | Medium cost (22%) |
| Railway | $12-20 | Infrastructure |
| Resend | $0-5 | Email delivery |
| Airtable | $0 | Free tier |
| **Total** | **~$237-260** | At 100 interviews/month |

### Annual Cost Projection
- 100 interviews/month: **~$2,850-3,120/year**
- 200 interviews/month: **~$5,700-6,240/year**

### How to Reduce Costs
1. **VAPI Volume Discounts** - 500+ minutes/month: negotiate rates
2. **Model Optimization** - Use gpt-3.5-turbo instead of gpt-4 (30% savings)
3. **Batch Processing** - Process transcripts in batches (15% discount)
4. **Free Tier Usage** - Maximize Resend free tier (100 emails/day)

---

## Dashboard Admin Access

### Login Credentials
- **Email:** contact@enqavon-incorporated.com
- **Password:** [Set during setup - see your .env file]

### What You Can Do
- ✅ View all candidates in real-time table
- ✅ Filter by status (pending, scheduled, accept, reject)
- ✅ Read interview transcripts
- ✅ Listen to interview recordings (if available)
- ✅ See interview scores and notes
- ✅ Accept or reject candidates
- ✅ Export data to CSV
- ✅ View analytics and statistics

### Navigation
1. **Candidates Table** - All applications
2. **Status Filters** - Filter by hiring stage
3. **Candidate Details** - Click any row to see full info
4. **Transcripts** - View interview transcripts
5. **Analytics** - See stats (pending, scheduled, etc.)

---

## Testing Checklist

Use this to verify everything works:

- [ ] Can access scheduling page (schedule-interview.html)
- [ ] Can submit a test candidate
- [ ] Confirmation email arrives
- [ ] Candidate appears in Airtable
- [ ] Can access admin dashboard (dashboard/)
- [ ] Can see candidate in dashboard
- [ ] Can access manage interview demo (manage-interview-demo.html)
- [ ] Can visit interview link from email
- [ ] Can access configuration panel (config-panel.html)
- [ ] Can view SETUP_GUIDE.md
- [ ] Can log into n8n workflows
- [ ] Test email appears to be from correct sender

---

## Common Tasks

### How to Change Email Templates
1. Visit: https://enqavon-interviews.up.railway.app/config-panel.html
2. Scroll to "Email Templates" section
3. Edit confirmation, reminder, or rejection emails
4. Click "Save"
5. New emails will use updated template

### How to Change Interview Questions
1. Log into https://vapi.ai
2. Click "Assistants"
3. Select "Bloom Buddies Interview Assistant"
4. Edit "System Prompt" with new questions
5. Save - changes apply to next interview

### How to Change Colors/Branding
1. Log into https://enqavon-interviews.up.railway.app/config-panel.html
2. Update primary and secondary colors
3. Add logo URL
4. Update company name and email
5. Save changes

### How to Reschedule Interview Window
1. Edit .env file on your local machine
2. Change `DEFAULT_TIMEZONE_OFFSET` or specific candidate offset
3. Push to GitHub
4. Railway auto-deploys
5. Next interview uses new timezone

---

## Troubleshooting

### Email not arriving
- ✓ Check spam/junk folder
- ✓ Verify sender email in config panel
- ✓ Check Resend dashboard for delivery status
- ✓ Verify domain DNS records if using custom domain

### Interview times off by 1 hour
- ✓ Check candidate's system timezone setting
- ✓ Verify DEFAULT_TIMEZONE_OFFSET in Railway variables
- ✓ Check Airtable timezoneOffset field for that candidate

### Can't log into dashboard
- ✓ Verify admin email is correct
- ✓ Reset password via login page
- ✓ Clear browser cache and cookies
- ✓ Try different browser

### Interview not starting
- ✓ Verify OpenAI API key is active and has credits
- ✓ Check VAPI assistant is published
- ✓ Verify microphone/speaker permissions in browser
- ✓ Try in different browser (Chrome/Firefox recommended)

### Airtable integration not working
- ✓ Verify AIRTABLE_API_KEY in Railway variables
- ✓ Verify AIRTABLE_BASE_ID is correct
- ✓ Verify AIRTABLE_TABLE_NAME is "Candidates"
- ✓ Check Railway logs for errors

### n8n workflows not triggering
- ✓ Verify webhook URL is correct in VAPI settings
- ✓ Verify n8n service is running in Railway
- ✓ Check n8n workflow is activated
- ✓ Review execution logs in n8n dashboard

---

## GitHub Management

Your system is on the `customer/bloom-buddies` branch.

### To Update Your System
1. Make changes locally
2. Push to GitHub: `git push origin customer/bloom-buddies`
3. Railway auto-deploys automatically
4. Check Railway dashboard for deployment status

### To Get Latest Updates from Main
Contact your developer to merge updates from main → your branch

### Important: Never Commit Credentials
Your `.env` file is in `.gitignore` - **never** commit it to GitHub

---

## Support & Resources

### Documentation
- **Setup Guide:** https://enqavon-interviews.up.railway.app/SETUP_GUIDE.md
- **GitHub Repository:** https://github.com/hpettitt/WebCallTest
- **Your Branch:** `customer/bloom-buddies`

### External Services
- **Airtable Help:** https://support.airtable.com
- **VAPI Docs:** https://docs.vapi.ai
- **OpenAI API:** https://platform.openai.com/docs
- **Resend Email:** https://resend.com/docs
- **Railway Docs:** https://docs.railway.app
- **n8n Docs:** https://docs.n8n.io

### Emergency Contacts
- **Railway Status:** https://status.railway.app
- **VAPI Status:** https://status.vapi.ai
- **OpenAI Status:** https://status.openai.com

### Technical Support
Contact your developer for:
- System issues or bugs
- Customization requests
- Integration questions
- Credential resets
- Database recovery

---

## Security Checklist

Keep your system secure:

- [ ] Change admin password from setup default
- [ ] Rotate API keys quarterly
- [ ] Never share .env file
- [ ] Keep credentials in password manager
- [ ] Enable 2FA on all service accounts
- [ ] Review Railway logs regularly
- [ ] Backup Airtable data monthly
- [ ] Restrict dashboard access to authorized users
- [ ] Use HTTPS for all connections (automatic)
- [ ] Monitor costs in Railway dashboard

---

## Monthly Maintenance Tasks

### Weekly
- [ ] Check Railway logs for errors
- [ ] Monitor email delivery rate
- [ ] Verify VAPI call quality
- [ ] Review new candidates in Airtable

### Monthly
- [ ] Review API usage and costs
- [ ] Check Resend delivery metrics
- [ ] Update candidate list status
- [ ] Test disaster recovery

### Quarterly
- [ ] Rotate API keys
- [ ] Update security credentials
- [ ] Review system performance
- [ ] Backup important data

---

## Quick Reference Card

**Candidate Scheduling:** https://enqavon-interviews.up.railway.app/schedule-interview.html  
**Admin Dashboard:** https://enqavon-interviews.up.railway.app/dashboard/  
**Configuration Panel:** https://enqavon-interviews.up.railway.app/config-panel.html  
**Setup Documentation:** https://enqavon-interviews.up.railway.app/SETUP_GUIDE.md  
**n8n Workflows:** https://enqavon-workflows.up.railway.app  

**Email:** contact@enqavon-incorporated.com  
**Support Timezone:** Europe/Berlin (UTC+1)  
**Monthly Cost:** ~$237-260 (for ~100 interviews)  
**Cost Per Interview:** ~$2.27-2.32 (15 min avg)  

---

## Frequently Asked Questions

**Q: Can I use my own domain instead of .up.railway.app?**  
A: Yes! Update DNS CNAME records to point to Railway. Instructions in SETUP_GUIDE.md Part 7.

**Q: What happens to interview data if service goes down?**  
A: All data is backed up in Airtable. Railway has 99.9% uptime SLA. You can restore from Airtable backups.

**Q: Can I customize interview questions?**  
A: Yes! Edit the System Prompt in VAPI → Assistants → Your Assistant.

**Q: How long are interviews recorded?**  
A: Indefinitely until you delete from VAPI dashboard. You can download and archive locally.

**Q: Can candidates reschedule after starting interview?**  
A: No, reschedule link expires once interview starts. They must complete or cancel current interview.

**Q: What if a candidate is in a different timezone?**  
A: System automatically captures their timezone and displays times correctly. All emails show local times.

**Q: Can I export candidate data?**  
A: Yes! Use Airtable's export feature to download as CSV/Excel.

**Q: What happens if OpenAI API hits usage limit?**  
A: Interviews will fail with error message. Add budget/payment method in OpenAI dashboard.

**Q: Can I modify the dashboard design?**  
A: Yes, CSS files are in `server/public/dashboard/styles.css`. Edit and push to GitHub.

**Q: Is there automatic backup?**  
A: Airtable provides automatic backups. n8n can be configured for additional backups.

---

## Version Information

- **System Version:** 2.0 - Production Ready
- **Last Updated:** December 15, 2025
- **Customer Branch:** customer/bloom-buddies
- **Main Repository:** hpettitt/WebCallTest

---

**Welcome to your AI-powered interview automation system!**  
If you have any questions, contact your developer.

---

*This system was created with ❤️ to automate hiring and save you time.*
