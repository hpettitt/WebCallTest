# Self-Service Interview Management System

## Overview
Candidates can now reschedule or cancel their interviews without any admin intervention using a secure, unique link sent in their confirmation email.

## Features
✅ **Self-Service Rescheduling** - Candidates can choose a new date and time
✅ **Self-Service Cancellation** - Candidates can cancel their interview
✅ **Secure Token-Based Access** - Each candidate gets a unique, secure management link
✅ **Automatic Notifications** - Confirmation emails sent for all changes
✅ **Token Expiration** - Management links expire 24 hours after the interview
✅ **No Admin Work Required** - Everything is automated

## Setup Instructions

### 1. Add Field to Airtable

You need to add a new field to your Airtable "Candidates" table:

1. Open your Airtable base
2. Go to the "Candidates" table
3. Add a new field:
   - **Field Name**: `Management Token`
   - **Field Type**: Single line text
   - **Description**: Secure token for candidate self-service management

That's it! The system will automatically populate this field when interviews are scheduled.

### 2. How It Works

**When a candidate schedules an interview:**
1. System generates a unique, secure management token (64-character hex string)
2. Token is saved to the `Management Token` field in Airtable
3. Confirmation email includes a "Manage My Interview" button with the secure link

**When a candidate clicks the management link:**
1. They see their interview details (name, email, date, time, status)
2. They can choose to:
   - **Reschedule**: Pick a new date and time
   - **Cancel**: Cancel the interview

**What happens automatically:**
1. Airtable record is updated with the new information
2. Confirmation email is sent to the candidate
3. Interview status is updated (Rescheduled or Cancelled)
4. Admin dashboard reflects the changes immediately

### 3. Management Link Format

```
https://bloombuddies.up.railway.app/manage-interview.html?token=<secure-token>
```

### 4. Security Features

- **Unique Tokens**: Each candidate gets a cryptographically secure unique token
- **Token Expiration**: Links expire 24 hours after the scheduled interview
- **Single Use per Candidate**: Each token is tied to one specific candidate
- **Status Validation**: Can't reschedule cancelled interviews

### 5. Email Updates

Confirmation emails now include:

**"Manage My Interview" Section:**
```
📅 Need to Reschedule or Cancel?
You can manage your interview anytime using this link:

[Manage My Interview Button]
```

### 6. Admin Benefits

✅ **Zero Manual Work**: Candidates handle their own changes
✅ **Automatic Updates**: Dashboard stays current automatically
✅ **Email Notifications**: You're kept informed of all changes
✅ **Professional Experience**: Candidates appreciate the convenience
✅ **Reduced No-Shows**: Easier to reschedule than to not show up

### 7. Candidate Experience

**Professional & Easy:**
1. Receive confirmation email with management link
2. Click "Manage My Interview" anytime
3. View current details
4. Reschedule or cancel with 2 clicks
5. Receive instant confirmation

### 8. API Endpoints (for reference)

**Verify Token & Get Interview:**
```
GET /api/interview/verify-token?token=<management-token>
```

**Reschedule Interview:**
```
POST /api/interview/reschedule
Body: { token, newDateTime }
```

**Cancel Interview:**
```
POST /api/interview/cancel
Body: { token }
```

## Troubleshooting

**Q: Candidate says the link doesn't work**
- Check that the `Management Token` field exists in Airtable
- Verify the token hasn't expired (24 hours after interview)
- Ensure the interview isn't already cancelled

**Q: Changes aren't showing in the dashboard**
- Refresh the dashboard (changes are real-time)
- Check Airtable directly to verify the update happened

**Q: Emails aren't being sent**
- Check Railway logs for email errors
- Verify EMAIL_* environment variables are set

## Testing

**To test the system:**
1. Schedule a new interview through the normal flow
2. Check the confirmation email for the "Manage My Interview" button
3. Click the button to open the management page
4. Try rescheduling to a different date/time
5. Verify you receive a new confirmation email
6. Check the dashboard to see the updated information

## Future Enhancements (Optional)

- Send admin notification when candidate reschedules/cancels
- Add reminder emails with management link 24 hours before interview
- Allow candidates to add notes when rescheduling
- Show available time slots on the reschedule page
- Add analytics on reschedule/cancellation rates
