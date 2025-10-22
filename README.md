This page is used by candidates to connect to Bloom buddies virtural interviewer.
🚀 Complete Workflow Features:
1. VAPI Webhook Trigger
Receives call completion data from VAPI
Webhook path: /vapi-call-completed
2. Data Processing Pipeline
Extract Call Data: Structures incoming VAPI data
AI Analysis: Uses OpenAI GPT-4 for comprehensive interview evaluation
Statistics Calculation: Computes detailed call metrics and scores
3. Scoring System
Overall Score (1-10)
Communication Skills (1-10)
Enthusiasm (1-10)
Professionalism (1-10)
Composite scores and hire probability
4. Data Storage
Airtable Integration: Updates candidate records with all scores and analysis
Comprehensive field mapping for interview data
5. Reporting System
Professional HTML Report: Beautiful, responsive design with scores, charts, and analysis
Email Notifications: Sends reports to HR team automatically
Responsive Design: Works on desktop and mobile
6. Advanced Analytics
Word count and speaking rate analysis
Sentence structure analysis
Call completion metrics
Cost tracking
Red flags and standout moments identification
📋 Setup Instructions:
1. Import the Workflow
Copy the JSON content from the file I created
Go to your n8n instance
Click "Import from JSON"
Paste the content and import
2. Configure Credentials
You'll need to set up these credentials in n8n:

OpenAI API: For AI analysis
Airtable: For database updates
Email Send: For sending reports
3. Update Configuration
Airtable Base ID: Replace YOUR_AIRTABLE_BASE_ID with your actual base ID
Email addresses: Update sender/receiver emails
Field mappings: Match your Airtable field names
4. Configure VAPI Webhook
In your VAPI dashboard, set the webhook URL to:


https://your-n8n-instance.com/webhook/vapi-call-completed
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