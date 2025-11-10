# Environment Variables Configuration Guide

## ✅ Setup Complete!

Your server is now configured to use environment variables for secure API key management.

## Files Created:

1. **`.env`** - Contains your actual API keys (NEVER commit this to git)
2. **`.env.example`** - Template file showing required variables (safe to commit)
3. **`index.js`** - Updated to load environment variables using dotenv

## How to Use Environment Variables:

In your JavaScript files, access variables like this:

```javascript
// Example: Access Airtable API key
const airtableKey = process.env.AIRTABLE_API_KEY;

// Example: Access VAPI API key
const vapiKey = process.env.VAPI_API_KEY;

// Example: Access n8n webhook URL
const webhookUrl = process.env.N8N_WEBHOOK_URL;
```

## Required API Keys to Configure:

### 1. **Airtable** (Database)
- `AIRTABLE_API_KEY` - Get from: https://airtable.com/account
- `AIRTABLE_BASE_ID` - Found in your Airtable base URL
- `AIRTABLE_TABLE_NAME` - Your candidates table name

### 2. **VAPI** (AI Interview)
- `VAPI_API_KEY` - Get from: https://vapi.ai
- `VAPI_ASSISTANT_ID` - Your configured assistant ID

### 3. **n8n** (Workflow Automation)
- `N8N_WEBHOOK_URL` - Your n8n webhook endpoint

### 4. **Email Service** (Notifications)
- `EMAIL_SERVICE` - e.g., 'gmail', 'sendgrid'
- `EMAIL_USER` - Your email address
- `EMAIL_PASSWORD` - App password (not your regular password!)
- `EMAIL_FROM` - Sender email address

### 5. **Security**
- `JWT_SECRET` - Random secret key for token generation
- Generate a strong secret: https://randomkeygen.com/

## Next Steps:

1. Fill in your actual API keys in the `.env` file
2. Never commit `.env` to git (it's already in .gitignore)
3. Share `.env.example` with team members as a template

## Testing:

Server is running with environment variables loaded!
Check the terminal output - you should see: `[dotenv] injecting env (16) from .env`

---

**Security Note:** Keep your `.env` file secure and never share it publicly!
