# Two-Factor Authentication (2FA) Guide

## Overview
The Bloom Buddies Dashboard supports Two-Factor Authentication (2FA) for enhanced security. This adds an extra layer of protection to user accounts.

---

## How 2FA Works

1. **User logs in** with email and password
2. **If 2FA is enabled** for their account, they must enter a 6-digit code
3. **System validates** the code before granting access
4. **Access granted** only if all credentials are correct

---

## Current Implementation

### Demo Mode (Current)
For demonstration and testing purposes:
- **Valid 2FA Codes**: `123456` or `000000`
- These codes work for any 2FA-enabled account
- No time-based expiration

### Production Mode (Recommended)
For production deployment, integrate with:
- **Google Authenticator** (TOTP)
- **Authy** (TOTP)
- **SMS-based codes** (via Twilio)
- **Email-based codes**

---

## User Configuration

### Enable 2FA for a User

Edit `secure-config.js`:

```javascript
'admin@bloombuddies.com': {
    passwordHash: this.hashPassword('secure123'),
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'accept', 'reject', 'manage_users'],
    mfaEnabled: true  // ✅ 2FA ENABLED
}
```

### Disable 2FA for a User

```javascript
'hr@bloombuddies.com': {
    passwordHash: this.hashPassword('hr2024secure!'),
    role: 'hr_manager',
    permissions: ['read', 'write', 'accept', 'reject'],
    mfaEnabled: false  // ❌ 2FA DISABLED (optional)
}
```

---

## Testing 2FA

### Test with Admin Account
1. Navigate to dashboard: `http://localhost:3000/dashboard/`
2. Enter credentials:
   - **Email**: `admin@bloombuddies.com`
   - **Password**: `secure123`
   - **2FA Code**: `123456` (required)
3. Click "Login"
4. Should successfully authenticate

### Test with HR Account
1. Navigate to dashboard: `http://localhost:3000/dashboard/`
2. Enter credentials:
   - **Email**: `hr@bloombuddies.com`
   - **Password**: `hr2024secure!`
   - **2FA Code**: (leave blank - not required)
3. Click "Login"
4. Should successfully authenticate

### Error Scenarios

**Missing 2FA Code (when required):**
```
Error: "2FA code is required for this account"
```

**Invalid 2FA Code:**
```
Error: "Invalid 2FA code. Please try again."
```

**Wrong Password:**
```
Error: "Invalid email or password"
```

---

## Production Integration

### Option 1: Google Authenticator / Authy (TOTP)

Install TOTP library:
```bash
npm install speakeasy qrcode
```

Update `auth.js`:
```javascript
const speakeasy = require('speakeasy');

// Generate secret for each user (one-time setup)
generateTOTPSecret(email) {
    return speakeasy.generateSecret({
        name: `Bloom Buddies (${email})`,
        issuer: 'Bloom Buddies'
    });
}

// Validate TOTP code
validate2FA(code, userSecret) {
    return speakeasy.totp.verify({
        secret: userSecret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow 2 time steps (60 seconds tolerance)
    });
}
```

### Option 2: SMS-based 2FA (Twilio)

Install Twilio:
```bash
npm install twilio
```

Update server `index.js`:
```javascript
const twilio = require('twilio');
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Send SMS code
app.post('/api/send-2fa-code', async (req, res) => {
    const { phoneNumber } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code temporarily (use Redis in production)
    temporaryCodes[phoneNumber] = {
        code: code,
        expires: Date.now() + 300000 // 5 minutes
    };
    
    // Send SMS
    await client.messages.create({
        body: `Your Bloom Buddies verification code is: ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
    });
    
    res.json({ success: true });
});

// Validate SMS code
app.post('/api/validate-2fa-code', (req, res) => {
    const { phoneNumber, code } = req.body;
    const stored = temporaryCodes[phoneNumber];
    
    if (!stored || Date.now() > stored.expires) {
        return res.json({ valid: false, error: 'Code expired' });
    }
    
    if (stored.code !== code) {
        return res.json({ valid: false, error: 'Invalid code' });
    }
    
    delete temporaryCodes[phoneNumber];
    res.json({ valid: true });
});
```

### Option 3: Email-based 2FA

Update server `index.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send email code
app.post('/api/send-email-2fa', async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    temporaryCodes[email] = {
        code: code,
        expires: Date.now() + 300000 // 5 minutes
    };
    
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Bloom Buddies Verification Code',
        html: `
            <h2>Verification Code</h2>
            <p>Your verification code is: <strong>${code}</strong></p>
            <p>This code expires in 5 minutes.</p>
        `
    });
    
    res.json({ success: true });
});
```

---

## Security Best Practices

### ✅ DO:
- Use TOTP (Google Authenticator/Authy) for best security
- Store 2FA secrets encrypted in database
- Implement rate limiting on 2FA attempts
- Provide backup codes for account recovery
- Log all 2FA events for security auditing
- Allow users to enable/disable their own 2FA
- Send notification when 2FA is enabled/disabled

### ❌ DON'T:
- Use simple, predictable codes in production
- Store 2FA secrets in plain text
- Allow unlimited 2FA attempts
- Share 2FA codes across multiple users
- Disable 2FA for admin accounts

---

## User Management

### Add New User with 2FA

Edit `secure-config.js`:
```javascript
'newuser@bloombuddies.com': {
    passwordHash: this.hashPassword('NewUser2024!'),
    role: 'staff',
    permissions: ['read'],
    mfaEnabled: true,
    // For TOTP in production:
    totpSecret: 'JBSWY3DPEHPK3PXP' // Generate per user
}
```

### Reset User's 2FA

If a user loses access to their 2FA device:

1. **Temporary Disable** (secure-config.js):
```javascript
mfaEnabled: false  // Temporarily disable
```

2. **User Re-enables** after login with new device

3. **Admin Generates New Secret** for TOTP

---

## Monitoring & Logging

The system logs all 2FA events:

```javascript
// View security logs in browser console
authManager.getSecurityEvents()

// Security events include:
// - LOGIN_SUCCESS
// - LOGIN_FAILED
// - INVALID_2FA
// - SESSION_EXPIRED
// - LOGOUT
```

---

## Current Users & 2FA Status

| Email | Password | 2FA Status | Valid Codes |
|-------|----------|------------|-------------|
| admin@bloombuddies.com | secure123 | ✅ **REQUIRED** | 123456, 000000 |
| hr@bloombuddies.com | hr2024secure! | ❌ Optional | N/A |
| interviewer@bloombuddies.com | interviewer2024! | ❌ Optional | N/A |

---

## Troubleshooting

### Issue: "2FA code is required for this account"
**Solution**: Enter one of the valid demo codes (123456 or 000000)

### Issue: "Invalid 2FA code"
**Solutions**:
- Verify you entered exactly 6 digits
- Try the other demo code (000000 instead of 123456)
- Check that 2FA is actually enabled for the user
- Clear browser cache and try again

### Issue: Can't login even with correct 2FA code
**Solutions**:
- Check browser console for errors (F12)
- Verify password is correct first
- Check that account is not locked from too many failed attempts
- Wait 15 minutes if locked out

### Issue: Need to disable 2FA for testing
**Solution**: Edit `secure-config.js` and set `mfaEnabled: false` for the user

---

## Future Enhancements

Planned features for 2FA:

- [ ] Self-service 2FA enrollment
- [ ] QR code generation for Google Authenticator
- [ ] Backup codes for account recovery
- [ ] SMS 2FA option
- [ ] Email 2FA option
- [ ] Remember device for 30 days
- [ ] 2FA status in user profile
- [ ] Admin panel to manage user 2FA settings
- [ ] Audit log for 2FA events
- [ ] Export security logs

---

## Support

For 2FA issues or questions:
1. Check this guide
2. Review browser console errors (F12)
3. Verify user configuration in secure-config.js
4. Check security event logs
5. Contact system administrator

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0
