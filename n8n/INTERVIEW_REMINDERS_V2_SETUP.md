# Interview Reminder Workflow v2 - Action Based

## Overview
This workflow sends interview reminders based on the **action field** value of "waiting for interview". It automatically:

1. ✅ Sends reminders 1 hour **before** interview
2. ✅ Sends reminders 1 hour **after** interview
3. ✅ Sends follow-up 1 day **after** interview
4. ✅ Sends final follow-up 3 days **after** interview
5. ❌ **Cancels** interview if 72+ hours have passed (marks as "missed")
6. 📊 Increments "reminders sent" counter each time

## Prerequisites

### 1. Airtable Field Requirements
Your "Candidates" table must have these fields:

**Required fields (to retrieve):**
- `Candidate Name` (Text)
- `Email` (Email)
- `Interview Time` (DateTime - stored in UTC)
- `action` (Single select or Text) - with value "waiting for interview"
- `status` (Single select or Text) - values: "scheduled", "cancelled", etc.
- `reminders sent` (Number field - increment counter)

**For tracking (optional but recommended):**
- `appointment time` (if different from Interview Time)
- `hours from interview` (formula field - calculated)

### 2. Airtable API Connection
- Ensure n8n has OAuth2 access to your Airtable base
- Base ID: `appODUV0mBmrmWeKX`
- Table: `Candidates`

### 3. Resend Email Configuration
- API key configured in n8n
- Verified sender: `noreply@ai.xenergies.com`

### 4. Environment Variables (Railway)
- `AIRTABLE_BASE_ID` ✅
- `RESEND_API_KEY` ✅

## Workflow Logic

```
Every 5 minutes:
  ↓
Query Airtable: GET all candidates WHERE action = "waiting for interview"
  ↓
For each candidate:
  ↓
Calculate hours from now to Interview Time
  ↓
├─ If hours < -72 (72+ hours past):
│  ├─ Send: "Interview Cancelled" message
│  ├─ Update: status = "cancelled"
│  ├─ Update: action = "missed"
│  └─ Increment: reminders sent +1
│
├─ If -1.5 < hours < -0.5 (1 hour before):
│  ├─ Send: "Interview in 1 Hour!" message
│  └─ Increment: reminders sent +1
│
├─ If 0.5 < hours < 1.5 (1 hour after):
│  ├─ Send: "Thank You for Interview" message
│  └─ Increment: reminders sent +1
│
├─ If 23.5 < hours < 24.5 (1 day after):
│  ├─ Send: "Follow-up" message
│  └─ Increment: reminders sent +1
│
└─ If 71.5 < hours < 72.5 (3 days after):
   ├─ Send: "Final Update" message
   └─ Increment: reminders sent +1
```

## Setup in n8n

### Step 1: Import Workflow
1. Open n8n
2. **Workflows** → **Import from file**
3. Select `Interview-Reminder-Workflow-v2.json`

### Step 2: Configure Airtable Node
Click on **"Get Waiting for Interview Candidates"** node:
- **Base**: `appODUV0mBmrmWeKX` (or your base ID)
- **Table**: `Candidates`
- **Filter Formula**: `{action} = "waiting for interview"`

### Step 3: Verify Email Fields
In the **"Send Email via Resend"** node:
- **From**: `noreply@ai.xenergies.com`
- **To**: `={{ $json.fields.Email }}`
- Subject and body are auto-generated ✅

### Step 4: Update Airtable Field Names
In **"Update Airtable Record"** node, verify field IDs match your Airtable:
- `reminders sent` - Number field
- `status` - for "cancelled" value
- `action` - for "missed" value

If field names differ, adjust in this node.

### Step 5: Test
1. **Execute Workflow** (manual test)
2. Check:
   - ✅ Airtable candidates fetched
   - ✅ Hours calculation correct
   - ✅ Email sent successfully
   - ✅ Airtable record updated with new "reminders sent" value

### Step 6: Activate
Toggle **"Active"** switch to ON. Workflow runs every 5 minutes.

## Email Templates

### Message Type: "cancelled"
**When**: 72+ hours after interview with no response
**Subject**: ❌ Your Interview Has Been Cancelled
**Body**: Notification that interview was cancelled due to no-show

### Message Type: "before"
**When**: 1 hour before scheduled interview
**Subject**: 🎯 Your Interview is in 1 Hour!
**Body**: Confirmation, time, and interview link

### Message Type: "after"
**When**: 1 hour after interview completed
**Subject**: ✅ Thank You for Your Interview - Reschedule if Needed
**Body**: Thank you message + reschedule option

### Message Type: "oneDay"
**When**: 24 hours after interview
**Subject**: 📋 Follow-up on Your Interview
**Body**: Follow-up message about decision timeline

### Message Type: "threeDays"
**When**: 72 hours after interview
**Subject**: 📬 We Have an Update About Your Interview
**Body**: Final update that decision coming soon

## Customizing Timing

Edit the **"Calculate Hours and Message Type"** node to adjust windows:

```javascript
// Change -1.5 and -0.5 for "1 hour before" window
if (hoursFromInterview >= -1.5 && hoursFromInterview <= -0.5)

// Change 0.5 and 1.5 for "1 hour after" window
if (hoursFromInterview >= 0.5 && hoursFromInterview <= 1.5)

// Change 23.5 and 24.5 for "24 hour" window
if (hoursFromInterview >= 23.5 && hoursFromInterview <= 24.5)

// Change 71.5 and 72.5 for "72 hour" window
if (hoursFromInterview >= 71.5 && hoursFromInterview <= 72.5)

// Change -72 for cancellation threshold
if (hoursFromInterview < -72)
```

## Workflow Advantages Over v1

✅ **Cleaner filtering**: Uses `action` field to find candidates (not checkbox fields)
✅ **Dynamic calculation**: Calculates hours fresh each run (real-time)
✅ **Automatic cancellation**: Handles no-shows after 72 hours
✅ **Counter tracking**: Tracks total reminders sent per candidate
✅ **Flexible timing**: Easy to adjust reminder windows
✅ **Simpler maintenance**: No need for 4 separate checkbox fields

## Airtable Suggested Setup

Add these fields to "Candidates" table if not present:

| Field Name | Type | Notes |
|-----------|------|-------|
| action | Single Select | Values: "waiting for interview", "missed", "completed", etc. |
| status | Single Select | Values: "scheduled", "cancelled", "completed" |
| reminders sent | Number | Incremented by workflow |
| Interview Time | DateTime | UTC format (Airtable default) |
| Email | Email | Candidate email |

## Troubleshooting

**Emails not sending?**
- ✅ Check Resend credentials
- ✅ Verify sender email verified in Resend
- ✅ Check n8n execution logs

**Wrong candidates being processed?**
- ✅ Verify filter formula: `{action} = "waiting for interview"`
- ✅ Check action field values exactly match "waiting for interview"

**Duplicate emails?**
- ✅ Workflow runs every 5 minutes with 1-hour windows, so won't duplicate
- ✅ If issues, increase window tolerance (e.g., -2 to 0 instead of -1.5 to -0.5)

**Timing issues?**
- ✅ Verify Interview Time in Airtable is in UTC
- ✅ Check server timezone (should match UTC)
- ✅ Adjust hour windows if needed

## Next Steps

1. ✅ Ensure Airtable has required fields
2. ✅ Import workflow JSON
3. ✅ Configure Airtable connection
4. ✅ Test with one candidate
5. ✅ Activate workflow
