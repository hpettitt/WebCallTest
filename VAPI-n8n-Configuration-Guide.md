# VAPI to n8n Webhook Configuration Guide

## Overview
This guide explains how to properly configure n8n webhooks to receive and process VAPI events, specifically handling transcript data from completed interviews.

## VAPI Event Types
VAPI sends different types of events to your webhook:
- `call-started` - When a call begins
- `call-ended` - When a call ends (with summary data)
- `transcript` - Real-time transcript segments during the call
- `function-call` - When VAPI executes a function

## n8n Webhook Setup

### 1. Basic Webhook Configuration
```json
{
  "parameters": {
    "path": "vapi-call-completed",
    "httpMethod": "POST",
    "responseMode": "responseNode",
    "options": {
      "rawBody": false,
      "allowedOrigins": "*"
    }
  }
}
```

### 2. VAPI Event Payload Structure

#### Transcript Event Payload:
```json
{
  "type": "transcript",
  "message": {
    "type": "transcript",
    "transcript": "Hello, is this John? Yes, this is John speaking...",
    "call": {
      "id": "call_123456",
      "status": "in-progress",
      "startedAt": "2024-01-15T10:30:00Z",
      "phoneNumber": "+1234567890",
      "metadata": {
        "candidateName": "John Smith",
        "sessionId": "session_789"
      }
    }
  }
}
```

#### Call Ended Event Payload:
```json
{
  "type": "call-ended",
  "message": {
    "type": "call-ended",
    "call": {
      "id": "call_123456",
      "status": "ended",
      "startedAt": "2024-01-15T10:30:00Z",
      "endedAt": "2024-01-15T10:45:00Z",
      "phoneNumber": "+1234567890",
      "duration": 900,
      "cost": 0.25,
      "recordingUrl": "https://recording-url.com/file.mp3",
      "transcript": "Full conversation transcript here...",
      "summary": "AI generated call summary",
      "metadata": {
        "candidateName": "John Smith",
        "sessionId": "session_789"
      }
    }
  }
}
```

## Filtering Events in n8n

### Filter Node Configuration for Transcript Events:
```json
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "leftValue": "={{ $json.type }}",
        "rightValue": "transcript",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }
    ],
    "combinator": "and"
  }
}
```

### Filter for Call Ended Events:
```json
{
  "conditions": {
    "conditions": [
      {
        "leftValue": "={{ $json.type }}",
        "rightValue": "call-ended",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }
    ]
  }
}
```

## Data Extraction Examples

### Extract Candidate Name:
```javascript
// Multiple fallback paths for candidate name
const candidateName = $json.message?.call?.metadata?.candidateName || 
                     $json.call?.metadata?.candidateName || 
                     $json.metadata?.candidateName || 
                     'Unknown Candidate';
```

### Extract Transcript:
```javascript
// For transcript events
const transcript = $json.message?.transcript || 
                  $json.transcript || 
                  $json.message?.call?.transcript || 
                  $json.call?.transcript || '';
```

### Extract Call Duration:
```javascript
// Calculate duration from timestamps
const duration = $json.message?.call?.endedAt && $json.message?.call?.startedAt ? 
  new Date($json.message.call.endedAt).getTime() - new Date($json.message.call.startedAt).getTime() : 0;

// Or use provided duration
const duration = $json.message?.call?.duration || $json.call?.duration || 0;
```

## Complete Workflow Structure

1. **Webhook Trigger** - Receives POST from VAPI
2. **Debug Node** - Log incoming data for troubleshooting
3. **Type Filter** - Only process transcript/call-ended events
4. **Data Extraction** - Extract relevant information
5. **Content Validation** - Ensure transcript exists
6. **AI Processing** - Analyze with OpenAI/ChatGPT
7. **Database Update** - Store results in Airtable
8. **Response** - Send confirmation back to VAPI

## Common Issues & Solutions

### Issue: Events not filtering properly
**Solution**: Check that the filter condition uses the exact field path:
```javascript
// Correct
"{{ $json.type }}" === "transcript"

// Incorrect (missing $json prefix)
"{{ type }}" === "transcript"
```

### Issue: Candidate name not found
**Solution**: Use multiple fallback paths and log the raw data:
```javascript
console.log('Raw VAPI data:', JSON.stringify($json, null, 2));
```

### Issue: Empty transcript
**Solution**: Add validation before processing:
```javascript
if (!transcript || transcript.trim().length === 0) {
  console.warn('Empty transcript received');
  return []; // Skip processing
}
```

## Testing Your Webhook

### 1. Use webhook-debug.html to test:
```html
<!-- Test POST request to your n8n webhook -->
<script>
fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'transcript',
    message: {
      transcript: 'Test transcript content',
      call: {
        id: 'test_call_123',
        metadata: {
          candidateName: 'Test Candidate'
        }
      }
    }
  })
});
</script>
```

### 2. Check n8n execution logs:
- Look for successful webhook executions
- Check filter node outputs
- Verify data extraction results

## VAPI Assistant Configuration

In your VAPI assistant, ensure you're setting the metadata correctly:

```javascript
// In interview.html
const assistantOverrides = {
  variableValues: {
    candidateName: candidateName // This will be available in webhook
  },
  metadata: {
    candidateName: candidateName,
    sessionId: sessionId
  }
};
```

## Webhook URL Configuration

Your n8n webhook URL will look like:
```
https://your-n8n-instance.com/webhook/vapi-call-completed
```

Configure this URL in:
1. VAPI assistant settings (if using assistant-level webhooks)
2. VAPI phone number configuration
3. Your interview.html file for credential requests

## Security Considerations

1. **Validate webhook source** - Check VAPI signature headers
2. **Rate limiting** - Implement to prevent abuse
3. **Error handling** - Always respond to VAPI even on failures
4. **Data sanitization** - Clean transcript data before AI processing

This configuration ensures proper handling of VAPI events with appropriate filtering and data extraction for your interview processing workflow.