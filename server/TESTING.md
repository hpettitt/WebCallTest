# Token Validation System - Testing Guide

## ✅ System Components Built

### 1. **Airtable Service** (`services/airtable.js`)
- ✅ Find candidate by token
- ✅ Validate appointment time (5 min before to 30 min after)
- ✅ Update candidate records
- ✅ Get all candidates for dashboard

### 2. **API Endpoints** (`index.js`)
- ✅ `POST /api/validate-token` - Validates token and time window
- ✅ `GET /api/candidates` - Get all candidates (for dashboard)
- ✅ `PUT /api/candidates/:id` - Update candidate status

### 3. **Frontend** (`public/index.html`)
- ✅ Token extraction from URL
- ✅ Automatic validation on page load
- ✅ User-friendly status messages
- ✅ Candidate information display
- ✅ Proceed to interview button

## 🔧 Setup Instructions

### 1. Configure Airtable

Your Airtable table needs these fields:

**Required Fields:**
- `Token` (Single line text) - Unique token for each candidate
- `Name` (Single line text) - Candidate's full name
- `Email` (Email) - Candidate's email
- `AppointmentTime` (Date with time) - Scheduled interview time
- `Status` (Single select) - Options: pending, accepted, rejected
- `InterviewCompleted` (Checkbox) - Whether interview is done

**Optional Fields:**
- `Phone` - Contact number
- `Position` - Job position applied for
- `InterviewSummary` - AI interview results
- `DecisionNotes` - Interviewer notes

### 2. Update .env File

Fill in your actual Airtable credentials:

\`\`\`env
AIRTABLE_API_KEY=your_actual_api_key
AIRTABLE_BASE_ID=your_actual_base_id
AIRTABLE_TABLE_NAME=Candidates
\`\`\`

Get your Airtable API key: https://airtable.com/account
Get your Base ID: From your Airtable base URL

### 3. Start the Server

\`\`\`bash
cd C:\\webcall-server
node index.js
\`\`\`

You should see:
\`\`\`
[dotenv] injecting env (16) from .env
Server is running on port 3000
Visit http://localhost:3000 to see the server
\`\`\`

## 🧪 Testing the System

### Test 1: Valid Token within Time Window

1. **Add a test candidate to Airtable:**
   - Token: `test123`
   - Name: `John Doe`
   - Email: `john@example.com`
   - AppointmentTime: Set to current time (now)
   - Status: `pending`
   - InterviewCompleted: unchecked

2. **Visit the validation page:**
   ```
   http://localhost:3000/index.html?token=test123
   ```

3. **Expected Result:**
   - ✅ Green success message
   - Shows candidate information
   - "Proceed to Interview" button appears

### Test 2: Token Too Early

1. **Update test candidate:**
   - AppointmentTime: Set to 10 minutes in the future

2. **Visit:** `http://localhost:3000/index.html?token=test123`

3. **Expected Result:**
   - ⏰ Orange warning message
   - "Interview window opens in X minutes"
   - No proceed button

### Test 3: Token Too Late

1. **Update test candidate:**
   - AppointmentTime: Set to 35 minutes ago

2. **Visit:** `http://localhost:3000/index.html?token=test123`

3. **Expected Result:**
   - ❌ Red error message
   - "Interview window closed X minutes ago"
   - No proceed button

### Test 4: Invalid Token

1. **Visit:** `http://localhost:3000/index.html?token=invalid999`

2. **Expected Result:**
   - ❌ Red error message
   - "Invalid token - candidate not found"

### Test 5: Interview Already Completed

1. **Update test candidate:**
   - InterviewCompleted: checked

2. **Visit:** `http://localhost:3000/index.html?token=test123`

3. **Expected Result:**
   - ❌ Error message
   - "Interview has already been completed"

## 📊 Time Window Logic

**Valid Access Window:**
- **Opens:** 5 minutes BEFORE appointment time
- **Closes:** 30 minutes AFTER appointment time
- **Total Window:** 35 minutes

**Examples:**
- Appointment: 2:00 PM
- Window Opens: 1:55 PM
- Window Closes: 2:30 PM

## 🔍 Debugging

### Check API Response Directly

Test the validation endpoint with curl or Postman:

\`\`\`bash
curl -X POST http://localhost:3000/api/validate-token \\
  -H "Content-Type: application/json" \\
  -d '{"token":"test123"}'
\`\`\`

### View Server Logs

Watch the terminal where the server is running for:
- Token validation attempts
- Airtable queries
- Error messages

### Common Issues

1. **"Cannot find module 'airtable'"**
   - Run: `npm install airtable cors axios`

2. **"Invalid API key"**
   - Check your `.env` file has correct AIRTABLE_API_KEY

3. **"Table not found"**
   - Verify AIRTABLE_BASE_ID and AIRTABLE_TABLE_NAME in `.env`

4. **CORS errors in browser**
   - Check FRONTEND_URL in `.env`
   - Ensure CORS middleware is enabled

## 📋 Next Steps

Once validation is working:

1. ✅ Build `interview.html` with VAPI integration
2. ✅ Add n8n webhook for interview results
3. ✅ Create interviewer dashboard
4. ✅ Add email notification system
5. ✅ Implement accept/reject workflow

---

**Need help?** Check server logs and browser console for detailed error messages.
