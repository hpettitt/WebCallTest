# n8n Webhook Integration Setup

## 🚀 Quick Setup Guide

### Step 1: Get Your n8n Webhook URL

1. **In your n8n workflow** (the one you created):
   - Click on your **Webhook node**
   - Copy the **Production URL** (should look like: `https://your-n8n-instance.com/webhook/your-webhook-path`)

2. **Update the config.js file**:
   ```javascript
   webhooks: {
       accept: 'YOUR_WEBHOOK_URL_HERE',  // Paste your n8n webhook URL
       reject: 'YOUR_WEBHOOK_URL_HERE',  // Same URL or separate one for reject
       refresh: ''
   },
   ```

### Step 2: Test the Integration

1. **Update a candidate status** in the dashboard (Accept or Reject)
2. **Check your n8n workflow** - it should trigger immediately
3. **Check browser console** for webhook confirmation messages

### Step 3: Webhook Payload Structure

Your n8n workflow will receive this data:
```json
{
  "action": "accept",  // or "reject"
  "timestamp": "2025-11-01T10:30:00.000Z",
  "candidate": {
    "id": "recXXXXXXXXXX",
    "fields": {
      "Candidate Name": "John Doe",
      "Email": "john@example.com",
      "status": "accept",
      // ... all other Airtable fields
    }
  }
}
```

### Step 4: n8n Workflow Configuration

Make sure your n8n workflow:
1. **Webhook trigger** accepts POST requests
2. **Content-Type** is set to `application/json`
3. **Extract data** using expressions like:
   - `{{ $json.candidate.fields['Candidate Name'] }}`
   - `{{ $json.candidate.fields.Email }}`
   - `{{ $json.action }}`

### Troubleshooting

**If webhooks aren't working:**

1. **Check the console** - Open browser dev tools and look for webhook errors
2. **Verify n8n workflow is active**
3. **Test webhook URL directly** - Try pasting it in browser to see if it responds
4. **Check n8n logs** for incoming requests

**Common Issues:**
- ❌ Webhook URL is empty or incorrect
- ❌ n8n workflow is not activated
- ❌ CORS issues (n8n should handle this automatically)
- ❌ Wrong HTTP method (should be POST)

### Success Indicators

✅ Browser console shows: `✅ Webhook notification sent successfully for accept`  
✅ n8n workflow execution appears in the executions list  
✅ Email is sent to candidate  

## Ready to Configure?

1. Copy your n8n webhook URL
2. Update `dashboard/config.js` with the URL
3. Test by accepting/rejecting a candidate
4. Check n8n for the execution

That's it! Your dashboard will now automatically trigger n8n workflows when candidates are accepted or rejected. 🎉