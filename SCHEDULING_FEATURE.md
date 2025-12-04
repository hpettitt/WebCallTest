# Self-Scheduling Feature Documentation

## Overview
This feature allows candidates to schedule their own interview times instead of using Calendly. The system provides a simple, branded scheduling page and automatically updates Airtable with the selected date and time.

## Features
- ✅ Public scheduling page with date/time picker
- ✅ Secure token-based access (prevents unauthorized scheduling)
- ✅ Time slot selection (9 AM - 5 PM EST)
- ✅ Automatic Airtable updates
- ✅ Confirmation email sent to candidate
- ✅ Mobile-responsive design
- ✅ Prevents scheduling in the past

## Files Created

### 1. Frontend
- **`server/public/schedule-interview.html`** - Scheduling page for candidates

### 2. Backend
- **`server/services/scheduling.js`** - Token generation and validation
- **Updates to `server/index.js`** - Two new API endpoints:
  - `GET /api/candidate/:id` - Get candidate info for scheduling page
  - `POST /api/schedule-interview` - Process the scheduling request
- **Updates to `server/services/airtable.js`** - Added `getCandidateById()` method
- **Updates to `server/services/email.js`** - Added `sendInterviewConfirmation()` method

## How It Works

### 1. Generate Scheduling Link
To send a scheduling link to a candidate:

```javascript
const schedulingService = require('./services/scheduling');

const candidateId = 'recXXXXXXXXXXXXXX'; // Airtable record ID
const email = 'candidate@example.com';
const baseUrl = 'http://localhost:3000'; // or your production URL

const schedulingLink = schedulingService.generateSchedulingLink(
  candidateId, 
  email, 
  baseUrl
);

console.log(schedulingLink);
// Output: http://localhost:3000/schedule-interview.html?id=recXXXXXXXXXXXXXX&token=Y2FuZGlkYXRl
```

### 2. Candidate Flow
1. Candidate receives email with scheduling link
2. Clicks link and opens scheduling page
3. Selects date (tomorrow or later)
4. Selects time slot (9 AM - 5 PM EST)
5. Clicks "Confirm Interview Time"
6. Receives confirmation email with details

### 3. Backend Processing
1. Validates token matches candidate email
2. Updates Airtable record with:
   - `Interview Date` field (datetime)
   - `Interview Status` field (set to "Scheduled")
3. Sends confirmation email to candidate

## Required Airtable Fields

Your Candidates table must have these fields:
- **Email** (Email)
- **Candidate Name** or **Name** (Single line text)
- **Interview Date** (Date with time - this will be updated)
- **Interview Status** (Single select - will be set to "Scheduled")

## API Endpoints

### GET /api/candidate/:id
Gets candidate information for the scheduling page.

**Parameters:**
- `id` (path) - Airtable record ID
- `token` (query) - Security token

**Response:**
```json
{
  "success": true,
  "candidate": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/schedule-interview
Schedules the interview.

**Body:**
```json
{
  "candidateId": "recXXXXXXXXXXXXXX",
  "token": "Y2FuZGlkYXRl",
  "interviewDate": "2025-11-20",
  "interviewTime": "14:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview scheduled successfully"
}
```

## Time Slots Available
The scheduling page offers 30-minute slots from 9 AM to 5 PM EST:
- 9:00 AM, 9:30 AM, 10:00 AM, 10:30 AM
- 11:00 AM, 11:30 AM, 12:00 PM, 12:30 PM
- 1:00 PM, 1:30 PM, 2:00 PM, 2:30 PM
- 3:00 PM, 3:30 PM, 4:00 PM, 4:30 PM
- 5:00 PM

You can customize these in `schedule-interview.html` (line 175).

## Integrating with Your Workflows

### Sending Scheduling Links via Email
Update your email templates to include the scheduling link:

```javascript
const schedulingService = require('./services/scheduling');
const emailService = require('./services/email');

async function sendInterviewInvite(candidateId, email, name) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const schedulingLink = schedulingService.generateSchedulingLink(
    candidateId, 
    email, 
    baseUrl
  );
  
  // Send email with the link
  // You can customize your existing email templates to include this link
  console.log(`Send this link to ${name}: ${schedulingLink}`);
}
```

### Using with n8n
In your n8n workflows, you can:
1. Get the candidate record ID from Airtable
2. Use the HTTP Request node to call your server
3. Generate the link and send it via email

Example n8n HTTP Request node:
- **Method**: POST
- **URL**: `http://your-server.com/api/generate-scheduling-link`
- **Body**: `{"candidateId": "{{$json.id}}", "email": "{{$json.email}}"}`

### Using with Airtable Automations
You can also include the scheduling link in Airtable automations:
1. Create a formula field for the link:
   ```
   CONCATENATE(
     "http://your-server.com/schedule-interview.html?id=", 
     RECORD_ID(),
     "&token=",
     LEFT(BASE64({Email}), 16)
   )
   ```
2. Include this field in your email automations

## Security
- **Token-based access**: Each link includes a token derived from the candidate's email
- **Token validation**: Backend verifies token matches the candidate
- **No sensitive data**: Tokens are simple base64 encoding (consider upgrading to JWT for production)

## Customization

### Changing Available Times
Edit `schedule-interview.html`, line 175:
```javascript
const timeSlots = [
    '09:00', '09:30', '10:00', // ... add or remove times
];
```

### Changing Colors/Branding
Edit the CSS in `schedule-interview.html` (lines 7-169)

### Blocking Specific Dates
You can add logic to disable specific dates (holidays, etc.) in the date picker.

## Testing

1. **Start your server**:
   ```powershell
   npm start
   ```

2. **Generate a test link**:
   ```javascript
   const schedulingService = require('./services/scheduling');
   const link = schedulingService.generateSchedulingLink(
     'rec1234567890abcd', // Use a real record ID from your Airtable
     'test@example.com',
     'http://localhost:3000'
   );
   console.log(link);
   ```

3. **Open the link in your browser**

4. **Select a date and time**

5. **Check Airtable** to confirm the update

6. **Check email** for confirmation

## Troubleshooting

### "Invalid token" error
- Ensure the email in the URL matches the candidate's email in Airtable
- Check that the token hasn't been modified

### Interview not updating in Airtable
- Verify field names match exactly (case-sensitive)
- Check server logs for errors
- Ensure Airtable API key has write permissions

### Email not sending
- Verify Gmail App Password in `.env`
- Check email service configuration
- Review server logs for email errors

## Future Enhancements
- [ ] Check for scheduling conflicts (prevent double-booking)
- [ ] Integration with Google Calendar
- [ ] Reminder emails before interview
- [ ] Rescheduling capability
- [ ] Admin view of all scheduled interviews
- [ ] Time zone selection
- [ ] Block out unavailable time slots dynamically
