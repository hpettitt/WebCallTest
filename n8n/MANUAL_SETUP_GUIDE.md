# Bloom Buddies Email Automation - Manual Setup Guide

Since the JSON import is having issues, here's how to create the workflow manually in n8n:

## Step 1: Create New Workflow
1. In n8n, click "New Workflow"
2. Name it "Bloom Buddies Email Automation"

## Step 2: Add Webhook Trigger
1. Click the "+" button
2. Search for "Webhook" 
3. Add it as the first node
4. Set webhook path: `bloom-buddies-status`
5. Copy the webhook URL (you'll need this for your dashboard)

## Step 3: Add IF Node for Accept
1. Add another node after webhook
2. Search for "IF"
3. Configure:
   - Condition: String
   - Value 1: `{{ $json.fields.status }}`
   - Operation: Equal
   - Value 2: `accept`

## Step 4: Add Gmail Node for Accept Email
1. Connect to the "true" output of the IF node
2. Add "Gmail" node
3. Configure:
   - To: `{{ $json.fields.Email }}`
   - Subject: `🎉 Welcome to Bloom Buddies - Application Accepted!`
   - Message: 
```
Dear {{ $json.fields['Candidate Name'].split(' ')[0] }},

We are pleased to inform you that we appreciated your responses, as well as your experience and availability for childcare. As such, you have earned an invitation link to create your babysitter account with us today.

Please sign up here: https://bloom-buddies.fr/sinscrire-babysitter

Then join our WhatsApp group: https://chat.whatsapp.com/LJ8xwMUpozjHITfuvvTYZV?mode=wwt

Looking forward to seeing you signed up with us and working with us.

Team Bloom
```

## Step 5: Add IF Node for Reject
1. Add another IF node after the webhook (parallel to first IF)
2. Configure:
   - Condition: String  
   - Value 1: `{{ $json.fields.status }}`
   - Operation: Equal
   - Value 2: `reject`

## Step 6: Add Gmail Node for Reject Email
1. Connect to the "true" output of the second IF node
2. Add "Gmail" node
3. Configure:
   - To: `{{ $json.fields.Email }}`
   - Subject: `Thank you for your interest - Bloom Buddies`
   - Message:
```
Dear {{ $json.fields['Candidate Name'] }},

Thank you for your interest in joining the Bloom Buddies team and for taking the time to speak with us about your experience and passion for childcare.

After careful consideration, we've decided to move forward with other candidates whose experience and availability more closely match our current needs.

We keep all applications on file for 6 months and may reach out if future opportunities arise.

Best regards,
The Bloom Buddies Team
```

## Step 7: Configure Credentials
1. Set up Gmail OAuth2 credentials
2. Test both email nodes

## Step 8: Update Dashboard Config
1. Copy the webhook URL from step 2
2. Update your `config.js`:
```javascript
webhooks: {
    accept: 'YOUR_WEBHOOK_URL_HERE',
    reject: 'YOUR_WEBHOOK_URL_HERE',
    refresh: ''
}
```

## Step 9: Test
1. Activate the workflow
2. Test by changing candidate status in your dashboard
3. Check that emails are sent correctly

This manual approach should work without any import issues!