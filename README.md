# WebCall Interview System

Bloom Buddies AI-powered interview platform with Airtable integration.

## 📁 Project Structure

```
WebCallTest/
├── server/              # Backend server (deployed to Railway)
│   ├── public/         # Frontend files (HTML, CSS, JS)
│   ├── services/       # Backend services (Airtable, Email, Users)
│   ├── scripts/        # Setup and utility scripts
│   ├── index.js        # Main server entry point
│   ├── package.json    # Server dependencies
│   └── .env            # Environment variables
├── n8n/                # n8n workflow configurations
├── .github/            # GitHub configuration and Copilot instructions
└── README.md           # This file
```

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm run install-server
   ```

2. **Configure environment:**
   - Copy `server/.env.example` to `server/.env`
   - Add your API keys and configuration

3. **Start the server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3000`

### Railway Deployment

Railway is configured to run from the `server/` directory automatically.

**Build Command:** `npm install`  
**Start Command:** `npm start`  
**Root Directory:** `server`

## 📚 Documentation

- **[Setup Guide](server/SETUP_GUIDE.md)** - Complete setup instructions
- **[Environment Setup](server/ENV_SETUP.md)** - Environment variables configuration
- **[Password Reset Setup](server/PASSWORD_RESET_SETUP.md)** - Email and password reset
- **[Testing Guide](server/TESTING.md)** - How to test features
- **[CV Integration Guide](server/CV_INTEGRATION_GUIDE.md)** - Resume/CV integration

## 🔑 Key Features

- **Token-based interview access** - Secure candidate verification
- **VAPI phone interviews** - AI-powered voice interviews
- **Airtable integration** - Candidate data management
- **Admin dashboard** - Review and manage candidates
- **Password reset** - Secure email-based password recovery
- **n8n automation** - Email notifications and workflows

## 🛠️ Management Commands

```bash
# Start server (from root)
npm start

# Create admin user (from root)
npm run setup-admin

# Development mode (from root)
npm run dev
```

## 📦 Environment Variables

See `server/.env.example` for all required variables:
- `AIRTABLE_API_KEY` - Airtable Personal Access Token
- `AIRTABLE_BASE_ID` - Your Airtable base ID
- `VAPI_API_KEY` - VAPI API key for interviews
- `EMAIL_USER` / `EMAIL_PASSWORD` - Email service credentials

## 🌐 Endpoints

- `/` - Interview landing page
- `/interview.html` - Phone interview interface
- `/dashboard/` - Admin dashboard
- `/api/*` - Backend API endpoints

---

## 🚀 n8n Workflow Features

### 1. VAPI Webhook Trigger
- Receives call completion data from VAPI
- Webhook path: `/vapi-call-completed`

### 2. Data Processing Pipeline
- Extract Call Data: Structures incoming VAPI data
- AI Analysis: Uses OpenAI GPT-4 for comprehensive interview evaluation
- Statistics Calculation: Computes detailed call metrics and scores

### 3. Scoring System
- Overall Score (1-10)
- Communication Skills (1-10)
- Enthusiasm (1-10)
- Professionalism (1-10)
- Composite scores and hire probability

### 4. Data Storage
- Airtable Integration: Updates candidate records with all scores and analysis
- Comprehensive field mapping for interview data

### 5. Reporting System
- Professional HTML Report: Beautiful, responsive design with scores, charts, and analysis
- Email Notifications: Sends reports to HR team automatically
- Responsive Design: Works on desktop and mobile

### n8n Setup Instructions

1. Import the workflow from `n8n/` directory
2. Configure credentials (OpenAI, Airtable, Email)
3. Update webhook URL in VAPI dashboard:
```
https://kraig-unjustified-collinearly.ngrok-free.dev/webhook/vapi-call-completed
```
5. Test the Workflow
Activate the workflow in n8n
Conduct a test interview
Check that VAPI sends completion data to your webhook
🎯 What You'll Get:
✅ Automated Processing: Complete hands-off interview analysis
✅ Professional Reports: Beautiful HTML reports with comprehensive insights
✅ Database Updates: Automatic Airtable record updates
✅ Email Notifications: Instant reports to your HR team
✅ Detailed Analytics: Speaking patterns, scores, and recommendations
✅ Scalable System: Handles multiple interviews automatically

The workflow is production-ready and includes error handling, comprehensive logging, and professional reporting. Just import it and configure your credentials to get started!

POSSIBLE FIELDS TO IMPLEMENT
Essential Fields:
- Name (candidate name)
- SessionToken (for correlation)
- Session_ID (VAPI session identifier)
- Interview_Status (Completed/Pending/etc.)
- Interview_Date (when interview occurred)
- Last_Interview_Date (tracks most recent interview)

Interview Scores:
- Overall_Score
- Communication_Score
- Enthusiasm_Score  
- Professionalism_Score
- Average_Score
- Hire_Probability

AI Analysis:
- AI_Summary (executive summary)
- Recommendation (Hire/Interview Further/Pass)
- Key_Strengths (bullet list)
- Areas_for_Improvement (bullet list)
- Red_Flags (areas of concern)
- Standout_Moments (memorable highlights)

Technical Data:
- Call_Duration_Minutes
- Word_Count
- Words_Per_Minute
- Call_Status
- Transcript (full conversation)
- Recording_URL (if available)
- Processed_At (when AI analysis completed)



Start development environment.
    1. load docker
    2. Play n8n Container
    3. open cmd line: load ngrok 
    4. configure ngrok http http:https://kraig-unjustified-collinearly.ngrok-free.dev/ 