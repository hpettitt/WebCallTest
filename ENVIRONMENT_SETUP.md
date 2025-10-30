# Environment Variables Setup Guide

## Quick Setup

1. **Copy the template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values:**
   ```bash
   # Use your favorite editor
   notepad .env
   # or
   code .env
   ```

3. **Never commit the `.env` file** - it's already in `.gitignore`

## Environment Variables Explained

### n8n Configuration
- `N8N_WEBHOOK_URL`: Your n8n webhook endpoint
- `N8N_API_KEY`: API key for n8n authentication

### VAPI Configuration
- `VAPI_API_KEY`: Your VAPI API key from dashboard
- `VAPI_PHONE_NUMBER_ID`: Phone number ID for calls
- `VAPI_ASSISTANT_ID`: Assistant configuration ID

### Gmail Configuration
- `GMAIL_USER`: Your Gmail address
- `GMAIL_APP_PASSWORD`: Gmail app-specific password (not your regular password)

### Airtable Configuration
- `AIRTABLE_API_KEY`: Your Airtable API key
- `AIRTABLE_BASE_ID`: Base ID from your Airtable URL
- `AIRTABLE_TABLE_NAME`: Name of your records table

## Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore`
- Use different `.env` files for different environments
- Rotate API keys regularly
- Use n8n's credential system when possible

❌ **DON'T:**
- Commit `.env` files to git
- Share API keys in chat/email
- Hardcode secrets in configuration files
- Use production keys in development

## For n8n Workflows

Instead of environment variables, use n8n's built-in credential system:
1. Go to Settings → Credentials in n8n
2. Add credentials for Gmail, Airtable, etc.
3. Reference them in nodes: `{{ $node["Gmail Credentials"].parameter.user }}`

## Troubleshooting

**If you accidentally committed secrets:**
1. Rotate all exposed API keys immediately
2. Remove the commit with sensitive data
3. Update `.gitignore` to prevent future issues

**File not found errors:**
- Make sure `.env` exists and has the right variable names
- Check that variable names match exactly (case-sensitive)