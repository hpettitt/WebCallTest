# Password Reset Feature - Setup Guide

## Overview

This system provides self-service password reset functionality for dashboard users. Passwords are securely stored in Airtable using bcrypt hashing, and reset links are sent via email.

---

## 📋 Prerequisites

Before using the password reset feature, you need:

1. **Airtable Base** with a "Dashboard Users" table
2. **Email Service** configured (Gmail, SendGrid, or SMTP)
3. **Node.js dependencies** installed (`bcrypt`, `nodemailer`)

---

## 🗂️ Airtable Setup

### Step 1: Create "Dashboard Users" Table

In your Airtable base, create a new table called **"Dashboard Users"** with these fields:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| **Email** | Single line text | Primary field, unique |
| **Password Hash** | Long text | Stores bcrypt-hashed password |
| **Name** | Single line text | User's display name |
| **Role** | Single select | Options: `admin`, `user` |
| **Reset Token** | Long text | Temporary token for password resets |
| **Reset Token Expiry** | Date | Token expiration time |
| **Created At** | Date | Account creation timestamp |
| **Last Login** | Date | Last successful login |

### Step 2: Table Configuration

1. Open your Airtable base
2. Click **"Add or import"** → **"Create empty table"**
3. Name it: `Dashboard Users`
4. Add the 8 fields listed above with their exact names and types

---

## 🔐 Environment Variables

Add these variables to your `.env` file (local) and Railway (production):

### Required for Password Reset:

```env
# Email Configuration (Choose one provider)

# Option 1: Gmail
EMAIL_PROVIDER=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use Gmail App Password, not regular password
EMAIL_FROM=Bloom Buddies <your.email@gmail.com>

# Option 2: SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@bloombuddies.com

# Option 3: Generic SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@bloombuddies.com

# Base URL (for reset links)
FRONTEND_URL=https://your-app.railway.app
```

### Railway Setup:

1. Go to Railway dashboard → Your project → **Variables**
2. Click **"+ New Variable"**
3. Add each email-related variable from above
4. Save - Railway will auto-redeploy

---

## 🚀 Initial Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `bcrypt` (password hashing)
- `nodemailer` (email sending)

### Step 2: Create Your First Admin User

Run the setup script:

```bash
# With default credentials (admin@bloombuddies.com / Admin123!)
node scripts/setup-admin.js

# With custom credentials
node scripts/setup-admin.js admin@example.com MySecurePass123 "Admin Name"
```

**Password Requirements:**
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number

### Step 3: Verify Airtable

1. Open your Airtable base
2. Check the "Dashboard Users" table
3. You should see your new admin user with:
   - Email
   - Password Hash (long encrypted string)
   - Name
   - Role = `admin`
   - Created At timestamp

---

## 📧 Email Provider Setup

### Option A: Gmail (Easiest for Testing)

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Bloom Buddies Dashboard"
   - Copy the 16-character password

3. **Add to Environment Variables:**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The app password
   EMAIL_FROM=Bloom Buddies <your.email@gmail.com>
   ```

### Option B: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com (free tier: 100 emails/day)

2. **Create API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Bloom Buddies Dashboard"
   - Permissions: "Full Access" or "Mail Send"
   - Copy the API key

3. **Verify Sender:**
   - Go to Settings → Sender Authentication
   - Verify your email domain or single sender email

4. **Add to Environment Variables:**
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@bloombuddies.com
   ```

---

## 🧪 Testing

### Test Email Configuration:

Create a test script `test-email.js`:

```javascript
require('dotenv').config();
const emailService = require('./services/email');

async function testEmail() {
  console.log('Testing email configuration...');
  
  const success = await emailService.testEmailConfig();
  
  if (success) {
    console.log('✅ Email configuration is valid!');
    
    // Send test email
    const sent = await emailService.sendPasswordResetEmail({
      email: 'your.email@example.com',
      name: 'Test User',
      resetToken: 'test-token-12345',
      resetUrl: 'http://localhost:3000',
    });
    
    if (sent) {
      console.log('✅ Test email sent successfully!');
    }
  } else {
    console.log('❌ Email configuration failed!');
  }
}

testEmail();
```

Run: `node test-email.js`

### Test Password Reset Flow:

1. **Request Reset:**
   - Go to: `/reset-password-request.html`
   - Enter your email
   - Click "Send Reset Link"
   - Check your email inbox (and spam folder)

2. **Reset Password:**
   - Click the link in the email
   - Enter new password (must meet requirements)
   - Click "Reset Password"
   - You should see success message

3. **Login:**
   - Go to `/dashboard/`
   - Log in with your new password
   - Should successfully authenticate

---

## 🔧 Troubleshooting

### "Email configuration not available"

**Problem:** Email environment variables not set

**Solution:**
```bash
# Check if variables are set (Railway)
# Variables tab → verify EMAIL_PROVIDER, EMAIL_USER, EMAIL_PASSWORD exist

# Check locally
cat .env | grep EMAIL
```

### "Invalid or expired reset token"

**Problem:** Token expired (1 hour limit) or already used

**Solution:**
- Request a new reset link
- Tokens are single-use and expire after 1 hour

### "User already exists"

**Problem:** Trying to create duplicate user with setup script

**Solution:**
- Use password reset feature instead
- Or manually delete the user from Airtable first

### "Failed to send reset email"

**Possible causes:**
1. **Gmail:** Not using App Password
   - Solution: Create App Password (see Gmail setup above)

2. **SendGrid:** API key invalid or sender not verified
   - Solution: Verify sender email in SendGrid dashboard

3. **SMTP:** Wrong host/port/credentials
   - Solution: Verify SMTP settings with your email provider

4. **Rate limiting:** Too many emails sent
   - Solution: Wait and try again, or upgrade email plan

### Email not received

**Check:**
1. ✅ Spam/junk folder
2. ✅ Email address is correct
3. ✅ Email service is configured correctly
4. ✅ Check server logs for errors:
   ```bash
   # Railway: View logs in dashboard
   # Local: Check terminal output
   ```

---

## 🔒 Security Best Practices

### Passwords:
- ✅ Hashed with bcrypt (salt rounds: 10)
- ✅ Never stored in plain text
- ✅ Never returned in API responses
- ✅ Minimum 8 characters enforced

### Reset Tokens:
- ✅ Cryptographically secure random (32 bytes)
- ✅ Single-use (cleared after reset)
- ✅ Expire after 1 hour
- ✅ Stored securely in Airtable

### Email Security:
- ✅ Use App Passwords for Gmail (not account password)
- ✅ Use API keys for SendGrid (not passwords)
- ✅ Never commit email credentials to git
- ✅ Use environment variables only

### API Endpoints:
- ✅ Don't reveal if user exists (security through obscurity)
- ✅ Rate limiting on login attempts (in SECURE_CONFIG)
- ✅ Validate password strength before accepting
- ✅ Send confirmation email after password change

---

## 📱 User Flows

### Forgot Password Flow:

```
User clicks "Forgot Password?" on login
    ↓
Enters email address
    ↓
System checks if user exists
    ↓
Generates secure reset token
    ↓
Sends email with reset link
    ↓
User clicks link in email
    ↓
Enters new password
    ↓
System validates & updates password
    ↓
Sends confirmation email
    ↓
User logs in with new password
```

### Admin Creating New User:

**Option 1: Using Airtable Interface**
1. Open Airtable → Dashboard Users table
2. Click "+ Add record"
3. Fill in: Email, Name, Role
4. Leave Password Hash empty
5. Save
6. User uses "Forgot Password" to set their password

**Option 2: Using Setup Script**
```bash
node scripts/setup-admin.js user@example.com TempPass123! "User Name"
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Airtable "Dashboard Users" table created with all 8 fields
- [ ] At least one admin user created (using setup script)
- [ ] Email service configured and tested
- [ ] Environment variables added to Railway:
  - [ ] `EMAIL_PROVIDER`
  - [ ] Email credentials (Gmail/SendGrid/SMTP)
  - [ ] `EMAIL_FROM`
  - [ ] `FRONTEND_URL`
- [ ] Test password reset flow end-to-end
- [ ] Verify emails are being received (check spam)
- [ ] Confirm login works with reset password
- [ ] Review Airtable user records look correct

---

## 📚 API Endpoints

### POST `/api/auth/request-password-reset`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

### GET `/api/auth/verify-reset-token/:token`

**Response:**
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

### POST `/api/auth/reset-password`

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "MyNewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password successfully reset"
}
```

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "MyPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

---

## 💡 Additional Features

### Adding More Users:

**Method 1: Airtable** (Recommended)
1. Open "Dashboard Users" table
2. Add record with Email, Name, Role
3. User uses "Forgot Password" to set password

**Method 2: Setup Script**
```bash
node scripts/setup-admin.js new.user@example.com Pass123! "New User"
```

### Changing User Roles:

1. Open Airtable → Dashboard Users
2. Find the user
3. Change "Role" field (admin/user)
4. Save - changes take effect immediately

### Removing Users:

1. Open Airtable → Dashboard Users
2. Find the user
3. Right-click → Delete record
4. User can no longer log in

---

## 🆘 Support

**Common Issues:**
- See Troubleshooting section above
- Check server logs for detailed error messages
- Verify all environment variables are set correctly

**Need Help?**
- Review this documentation
- Check Airtable field names match exactly
- Test email configuration with test script
- Verify Railway environment variables are set

---

## 🎉 You're All Set!

Your password reset system is now ready. Users can:
- ✅ Request password resets via email
- ✅ Receive secure reset links
- ✅ Set new passwords with validation
- ✅ Get confirmation emails

**Next Steps:**
1. Test the complete flow yourself
2. Create additional user accounts
3. Share the dashboard URL with your team
4. Monitor email delivery in production

**Dashboard URL:** `https://your-app.railway.app/dashboard/`

**Reset Request URL:** `https://your-app.railway.app/reset-password-request.html`
