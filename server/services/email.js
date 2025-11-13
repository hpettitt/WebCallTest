// Email Service - Handles sending emails for password resets and notifications
const nodemailer = require('nodemailer');

// Create email transporter
function createTransporter() {
  // Support multiple email providers
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
  
  if (emailProvider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (emailProvider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  } else {
    // Generic SMTP
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
}

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetToken - Password reset token
 * @param {string} options.resetUrl - Base URL for reset page
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordResetEmail({ email, name, resetToken, resetUrl }) {
  try {
    const transporter = createTransporter();
    
    const resetLink = `${resetUrl}/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Bloom Buddies Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
            .code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We received a request to reset your password for the Bloom Buddies Dashboard. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="code">${resetLink}</p>
              
              <div class="warning">
                ⚠️ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p>For security reasons, never share this link with anyone.</p>
              
              <p>Best regards,<br>
              Bloom Buddies Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bloom Buddies Dashboard</p>
              <p>If you have any questions, please contact your administrator</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

We received a request to reset your password for the Bloom Buddies Dashboard.

To reset your password, visit this link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
Bloom Buddies Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Send password change confirmation email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordChangedEmail({ email, name }) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Successfully Changed - Bloom Buddies Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              font-size: 48px;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            <div class="content">
              <div class="success-icon">🔒</div>
              
              <p>Hi ${name},</p>
              
              <p>Your password for the Bloom Buddies Dashboard has been successfully changed.</p>
              
              <p>If you made this change, no further action is required.</p>
              
              <p><strong>If you did not change your password,</strong> please contact your administrator immediately as your account may be compromised.</p>
              
              <p>Best regards,<br>
              Bloom Buddies Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bloom Buddies Dashboard</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Your password for the Bloom Buddies Dashboard has been successfully changed.

If you made this change, no further action is required.

If you did not change your password, please contact your administrator immediately.

Best regards,
Bloom Buddies Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password changed confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password changed email:', error);
    return false;
  }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} - Success status
 */
async function testEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  testEmailConfig,
};
